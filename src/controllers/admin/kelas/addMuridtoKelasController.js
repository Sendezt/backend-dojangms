const db = require("../../../config/database");

exports.addMuridToKelas = async (req, res) => {
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

    // Cek apakah kelas ada dan status aktif
    const [kelas] = await conn.query(
      "SELECT id, nama, status FROM kelas WHERE id = ? AND status = 'aktif'",
      [kelas_id],
    );
    if (kelas.length === 0) {
      return res
        .status(404)
        .json({ message: "Kelas tidak ditemukan atau tidak aktif" });
    }

    // Cek apakah user adalah murid (role = 'murid') dan status active
    const [user] = await conn.query(
      `SELECT u.id, u.name, u.status 
       FROM users u
       JOIN user_roles ur ON ur.user_id = u.id
       JOIN roles r ON r.id = ur.role_id
       WHERE u.id = ? AND r.name = 'murid' AND u.status = 'active'`,
      [user_id],
    );
    if (user.length === 0) {
      return res
        .status(404)
        .json({ message: "Murid tidak ditemukan atau tidak aktif" });
    }

    // Cek apakah murid sudah terdaftar di kelas ini dengan status aktif
    const [existing] = await conn.query(
      "SELECT id FROM kelas_murid WHERE kelas_id = ? AND user_id = ? AND status = 'aktif'",
      [kelas_id, user_id],
    );
    if (existing.length > 0) {
      return res
        .status(409)
        .json({ message: "Murid sudah terdaftar di kelas ini" });
    }

    // Cek apakah ada record nonaktif (soft delete) sebelumnya, jika ada bisa diaktifkan kembali
    const [inactiveRecord] = await conn.query(
      "SELECT id FROM kelas_murid WHERE kelas_id = ? AND user_id = ? AND status = 'nonaktif'",
      [kelas_id, user_id],
    );

    let result;
    if (inactiveRecord.length > 0) {
      // Update status menjadi aktif kembali
      await conn.query(
        "UPDATE kelas_murid SET status = 'aktif', tanggal_bergabung = CURDATE() WHERE id = ?",
        [inactiveRecord[0].id],
      );
      result = { insertId: inactiveRecord[0].id };
    } else {
      // Insert baru
      const [insertResult] = await conn.query(
        "INSERT INTO kelas_murid (kelas_id, user_id, tanggal_bergabung, status) VALUES (?, ?, CURDATE(), 'aktif')",
        [kelas_id, user_id],
      );
      result = insertResult;
    }

    // Ambil data pendaftaran terbaru
    const [enrollment] = await conn.query(
      `SELECT km.kelas_id, km.user_id, km.tanggal_bergabung, km.status,
              k.nama AS kelas_nama, u.name AS murid_nama
       FROM kelas_murid km
       JOIN kelas k ON k.id = km.kelas_id
       JOIN users u ON u.id = km.user_id
       WHERE km.kelas_id = ? AND km.user_id = ?`,
      [kelas_id, user_id],
    );

    return res.status(201).json({
      message: "Murid berhasil ditambahkan ke kelas",
      data: enrollment[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal menambahkan murid ke kelas",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
