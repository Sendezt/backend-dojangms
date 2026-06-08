const db = require("../../../config/database");

exports.updateLiburGlobal = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const id = parseInt(req.params.id);
    const { tanggal, keterangan } = req.body;

    if (isNaN(id) || id < 1) {
      return res.status(400).json({
        message: "ID libur global tidak valid",
      });
    }

    // Minimal satu field harus dikirim
    if (tanggal === undefined && keterangan === undefined) {
      return res.status(400).json({
        message: "Minimal satu field harus dikirim",
      });
    }

    // Cek apakah data ada
    const [existing] = await conn.query(
      `
      SELECT id, tanggal, keterangan
      FROM libur_global
      WHERE id = ?
      `,
      [id],
    );

    if (existing.length === 0) {
      return res.status(404).json({
        message: "Libur global tidak ditemukan",
      });
    }

    const current = existing[0];

    // Validasi tanggal hanya jika dikirim
    if (
      tanggal !== undefined &&
      (tanggal === "" || isNaN(Date.parse(tanggal)))
    ) {
      return res.status(400).json({
        message: "Format tanggal harus YYYY-MM-DD",
      });
    }

    // Gunakan nilai lama jika field tidak dikirim
    const newTanggal = tanggal ?? current.tanggal;
    const newKeterangan =
      keterangan !== undefined ? keterangan : current.keterangan;

    // Cek duplikasi tanggal
    const [duplicate] = await conn.query(
      `
      SELECT id
      FROM libur_global
      WHERE tanggal = ?
      AND id != ?
      `,
      [newTanggal, id],
    );

    if (duplicate.length > 0) {
      return res.status(409).json({
        message: "Tanggal sudah terdaftar sebagai libur global",
      });
    }

    // Update data
    await conn.query(
      `
      UPDATE libur_global
      SET tanggal = ?, keterangan = ?
      WHERE id = ?
      `,
      [newTanggal, newKeterangan, id],
    );

    // Ambil data terbaru
    const [updated] = await conn.query(
      `
      SELECT id, tanggal, keterangan, created_at
      FROM libur_global
      WHERE id = ?
      `,
      [id],
    );

    return res.status(200).json({
      message: "Libur global berhasil diperbarui",
      data: updated[0],
    });
  } catch (error) {
    console.error(error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Tanggal sudah terdaftar sebagai libur global",
      });
    }

    return res.status(500).json({
      message: "Gagal memperbarui libur global",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
