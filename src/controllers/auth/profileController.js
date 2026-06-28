const db = require("../../config/database");

/**
 * GET /api/user/profile
 * Mengambil data profil user yang sedang login
 */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const [rows] = await db.query(
      `SELECT 
         id, name, email, phone, foto, alamat, 
         jenis_kelamin, nama_wali, no_wali, 
         tanggal_lahir, status, created_at, updated_at
       FROM users 
       WHERE id = ?`,
      [userId],
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }

    const user = rows[0];

    // (Opsional) Ambil role user
    const [roles] = await db.query(
      `SELECT r.name 
       FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
       WHERE ur.user_id = ?`,
      [userId],
    );
    const roleNames = roles.map((r) => r.name);

    return res.status(200).json({
      success: true,
      message: "Berhasil mengambil profil",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        foto: user.foto,
        alamat: user.alamat,
        jenis_kelamin: user.jenis_kelamin,
        nama_wali: user.nama_wali,
        no_wali: user.no_wali,
        tanggal_lahir: user.tanggal_lahir,
        status: user.status,
        roles: roleNames,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil profil",
      error: error.message,
    });
  }
};
