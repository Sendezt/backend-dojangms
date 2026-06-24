const db = require("../../../config/database");

exports.softDeleteMuridFromKelas = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const { kelas_id, user_id } = req.body;

    // Validasi input
    if (!kelas_id || !user_id) {
      return res
        .status(400)
        .json({ message: "kelas_id dan user_id wajib diisi" });
    }
    if (isNaN(kelas_id) || kelas_id < 1) {
      return res.status(400).json({ message: "kelas_id tidak valid" });
    }
    if (isNaN(user_id) || user_id < 1) {
      return res.status(400).json({ message: "user_id tidak valid" });
    }

    // Cek apakah keanggotaan ada dengan status aktif
    const [enrollment] = await conn.query(
      `SELECT km.id, km.kelas_id, km.user_id, km.status, k.nama AS kelas_nama, u.name AS murid_nama
       FROM kelas_murid km
       JOIN kelas k ON k.id = km.kelas_id
       JOIN users u ON u.id = km.user_id
       WHERE km.kelas_id = ? AND km.user_id = ? AND km.status = 'aktif'`,
      [kelas_id, user_id],
    );
    if (enrollment.length === 0) {
      return res.status(404).json({
        message:
          "Keanggotaan murid di kelas tidak ditemukan atau sudah tidak aktif",
      });
    }

    // Lakukan soft delete (ubah status menjadi nonaktif)
    await conn.query(
      "UPDATE kelas_murid SET status = 'nonaktif' WHERE kelas_id = ? AND user_id = ?",
      [kelas_id, user_id],
    );

    // Ambil data setelah diubah
    const [updated] = await conn.query(
      `SELECT km.kelas_id, km.user_id, km.tanggal_bergabung, km.status,
              k.nama AS kelas_nama, u.name AS murid_nama
       FROM kelas_murid km
       JOIN kelas k ON k.id = km.kelas_id
       JOIN users u ON u.id = km.user_id
       WHERE km.kelas_id = ? AND km.user_id = ?`,
      [kelas_id, user_id],
    );

    return res.status(200).json({
      message: "Murid berhasil dikeluarkan dari kelas (status dinonaktifkan)",
      data: updated[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal menonaktifkan keanggotaan murid di kelas",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
