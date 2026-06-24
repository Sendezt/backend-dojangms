const db = require("../../../config/database");

exports.getDetailLiburJadwal = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const liburJadwalId = parseInt(req.params.id);

    if (isNaN(liburJadwalId) || liburJadwalId < 1) {
      return res.status(400).json({
        message: "ID libur jadwal tidak valid",
      });
    }

    const [rows] = await conn.query(
      `
      SELECT
        lj.id,
        lj.jadwal_id,
        lj.tanggal,
        lj.keterangan,
        lj.created_at,
        j.nama AS jadwal_nama,
        j.tipe AS jadwal_tipe
      FROM libur_jadwal lj
      INNER JOIN jadwal j
        ON j.id = lj.jadwal_id
      WHERE lj.id = ?
      LIMIT 1
      `,
      [liburJadwalId],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Data libur jadwal tidak ditemukan",
      });
    }

    const data = rows[0];

    return res.status(200).json({
      message: "Berhasil mengambil detail libur jadwal",
      data,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Gagal mengambil detail libur jadwal",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
