const db = require("../../../config/database");

exports.addPelatihToKelas = async (req, res) => {
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

    // Cek kelas aktif
    const [kelas] = await conn.query(
      "SELECT id, nama FROM kelas WHERE id = ? AND status = 'aktif'",
      [kelas_id],
    );
    if (kelas.length === 0) {
      return res
        .status(404)
        .json({ message: "Kelas tidak ditemukan atau tidak aktif" });
    }

    // Cek user pelatih aktif
    const [pelatih] = await conn.query(
      `SELECT u.id, u.name 
       FROM users u
       JOIN user_roles ur ON ur.user_id = u.id
       JOIN roles r ON r.id = ur.role_id
       WHERE u.id = ? AND r.name = 'pelatih' AND u.status = 'active'`,
      [user_id],
    );
    if (pelatih.length === 0) {
      return res
        .status(404)
        .json({ message: "Pelatih tidak ditemukan atau tidak aktif" });
    }

    // Cek apakah sudah pernah ditugaskan (termasuk nonaktif)
    const [existing] = await conn.query(
      "SELECT id, status FROM kelas_pelatih WHERE kelas_id = ? AND user_id = ?",
      [kelas_id, user_id],
    );

    let isReactivation = false;
    if (existing.length > 0) {
      // Jika sudah ada, update status menjadi aktif dan perbarui tanggal_bergabung
      await conn.query(
        "UPDATE kelas_pelatih SET status = 'aktif', tanggal_bergabung = CURDATE() WHERE id = ?",
        [existing[0].id],
      );
      isReactivation = existing[0].status === "nonaktif";
    } else {
      // Insert baru
      await conn.query(
        "INSERT INTO kelas_pelatih (kelas_id, user_id, status) VALUES (?, ?, 'aktif')",
        [kelas_id, user_id],
      );
    }

    // Ambil data final
    const [data] = await conn.query(
      `SELECT kp.id, kp.kelas_id, kp.user_id, kp.tanggal_bergabung, kp.status,
              k.nama AS kelas_nama, u.name AS pelatih_nama
       FROM kelas_pelatih kp
       JOIN kelas k ON k.id = kp.kelas_id
       JOIN users u ON u.id = kp.user_id
       WHERE kp.kelas_id = ? AND kp.user_id = ?`,
      [kelas_id, user_id],
    );

    const message = isReactivation
      ? "Pelatih berhasil diaktifkan kembali ke kelas"
      : "Pelatih berhasil ditugaskan ke kelas";

    return res.status(200).json({
      message,
      data: data[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal menugaskan pelatih ke kelas",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
