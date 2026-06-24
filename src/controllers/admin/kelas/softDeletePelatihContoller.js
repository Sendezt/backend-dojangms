const db = require("../../../config/database");

exports.softDeletePelatihFromKelas = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const { kelas_id, user_id } = req.body;

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

    // Cek apakah assign ada dan status aktif
    const [assign] = await conn.query(
      `SELECT kp.id, kp.kelas_id, kp.user_id, kp.status,
              k.nama AS kelas_nama, u.name AS pelatih_nama
       FROM kelas_pelatih kp
       JOIN kelas k ON k.id = kp.kelas_id
       JOIN users u ON u.id = kp.user_id
       WHERE kp.kelas_id = ? AND kp.user_id = ? AND kp.status = 'aktif'`,
      [kelas_id, user_id],
    );
    if (assign.length === 0) {
      return res
        .status(404)
        .json({
          message: "Pelatih tidak ditemukan atau sudah nonaktif di kelas ini",
        });
    }

    // Soft delete (ubah status menjadi nonaktif)
    await conn.query(
      "UPDATE kelas_pelatih SET status = 'nonaktif' WHERE kelas_id = ? AND user_id = ?",
      [kelas_id, user_id],
    );

    // Ambil data setelah update
    const [updated] = await conn.query(
      `SELECT kp.kelas_id, kp.user_id, kp.tanggal_bergabung, kp.status,
              k.nama AS kelas_nama, u.name AS pelatih_nama
       FROM kelas_pelatih kp
       JOIN kelas k ON k.id = kp.kelas_id
       JOIN users u ON u.id = kp.user_id
       WHERE kp.kelas_id = ? AND kp.user_id = ?`,
      [kelas_id, user_id],
    );

    return res.status(200).json({
      message: "Pelatih berhasil dinonaktifkan dari kelas",
      data: updated[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal menonaktifkan pelatih dari kelas",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
