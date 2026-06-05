const db = require("../../../config/database");

exports.softDeleteKelas = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const kelasId = parseInt(req.params.id);

    // Validasi ID
    if (!kelasId || isNaN(kelasId) || kelasId < 1) {
      return res.status(400).json({ message: "ID kelas tidak valid" });
    }

    // Cek apakah kelas ada
    const [kelasRows] = await conn.query(
      "SELECT id, nama, deskripsi, status FROM kelas WHERE id = ?",
      [kelasId]
    );
    if (kelasRows.length === 0) {
      return res.status(404).json({ message: "Kelas tidak ditemukan" });
    }

    // Jika sudah nonaktif, beri pesan
    if (kelasRows[0].status === "nonaktif") {
      return res.status(400).json({ message: "Kelas sudah dalam status nonaktif" });
    }

    // Lakukan soft delete (ubah status menjadi nonaktif)
    await conn.query(
      "UPDATE kelas SET status = 'nonaktif' WHERE id = ?",
      [kelasId]
    );

    // Ambil data terbaru setelah soft delete
    const [updatedRows] = await conn.query(
      "SELECT id, nama, deskripsi, status FROM kelas WHERE id = ?",
      [kelasId]
    );

    return res.status(200).json({
      message: "Kelas berhasil dinonaktifkan (soft delete)",
      data: updatedRows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal menonaktifkan kelas",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};