// controllers/pelatih/absensi/updateAbsensi.js

const db = require("../../../config/database");

const STATUS_ABSENSI = ["hadir", "izin", "sakit", "alpha"];

exports.updateAbsensi = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const pelatihId = req.user.id;

    const jadwalId = parseInt(req.params.jadwalId);
    const tanggal = req.params.tanggal;

    const { daftar_absensi } = req.body;

    if (!jadwalId || isNaN(jadwalId)) {
      return res.status(400).json({
        success: false,
        message: "jadwalId tidak valid",
      });
    }

    if (!tanggal || isNaN(Date.parse(tanggal))) {
      return res.status(400).json({
        success: false,
        message: "tanggal tidak valid",
      });
    }

    if (!Array.isArray(daftar_absensi) || daftar_absensi.length === 0) {
      return res.status(400).json({
        success: false,
        message: "daftar_absensi harus array",
      });
    }

    // cek akses pelatih ke kelas
    const [jadwalCheck] = await conn.query(
      `
      SELECT j.id, j.kelas_id
      FROM jadwal j
      JOIN kelas_pelatih kp
        ON kp.kelas_id = j.kelas_id
      WHERE j.id = ?
        AND kp.user_id = ?
        AND kp.status = 'aktif'
      `,
      [jadwalId, pelatihId],
    );

    if (jadwalCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Jadwal tidak ditemukan atau akses ditolak",
      });
    }

    // validasi maksimal 7 hari
    const tgl = new Date(tanggal);
    const now = new Date();

    const diffDays = (now.getTime() - tgl.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays > 7) {
      return res.status(403).json({
        success: false,
        message:
          "Absensi hanya dapat diedit maksimal 7 hari setelah tanggal latihan",
      });
    }

    await conn.beginTransaction();

    for (const item of daftar_absensi) {
      const { user_id, status, catatan } = item;

      if (!STATUS_ABSENSI.includes(status)) {
        await conn.rollback();

        return res.status(400).json({
          success: false,
          message: `Status harus salah satu: ${STATUS_ABSENSI.join(", ")}`,
        });
      }

      const [existing] = await conn.query(
        `
        SELECT id
        FROM absensi
        WHERE jadwal_id = ?
          AND user_id = ?
          AND tanggal = ?
        `,
        [jadwalId, user_id, tanggal],
      );

      if (existing.length === 0) {
        await conn.rollback();

        return res.status(404).json({
          success: false,
          message: `Absensi user ${user_id} tidak ditemukan`,
        });
      }

      await conn.query(
        `
        UPDATE absensi
        SET
          status = ?,
          catatan = ?,
          dicatat_oleh = ?
        WHERE id = ?
        `,
        [status, catatan?.trim() || null, pelatihId, existing[0].id],
      );
    }

    await conn.commit();

    return res.status(200).json({
      success: true,
      message: "Absensi berhasil diperbarui",
    });
  } catch (error) {
    await conn.rollback();

    return res.status(500).json({
      success: false,
      message: "Gagal memperbarui absensi",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
