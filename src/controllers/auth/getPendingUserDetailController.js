// src/controllers/admin/users/getPendingUserDetailController.js
const db = require("../../config/database");

exports.getPendingUserDetail = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId) || userId < 1) {
      return res.status(400).json({
        success: false,
        message: "ID user tidak valid",
      });
    }

    const [rows] = await db.query(
      `SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.alamat,
        u.jenis_kelamin,
        u.nama_wali,
        u.no_wali,
        u.tanggal_lahir,
        u.tahun_lahir,
        u.status,
        u.created_at,
        u.updated_at,
        b.id AS belt_id,
        b.name AS belt_name
      FROM users u
      JOIN user_roles ur ON ur.user_id = u.id
      JOIN roles r ON r.id = ur.role_id
      LEFT JOIN user_belts ub ON ub.user_id = u.id AND ub.is_current = 1
      LEFT JOIN belts b ON b.id = ub.belt_id
      WHERE u.id = ? AND r.name = 'murid' AND u.status = 'pending'
      LIMIT 1`,
      [userId],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User pending tidak ditemukan",
      });
    }

    const user = rows[0];

    // Format response
    const data = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      alamat: user.alamat,
      jenis_kelamin: user.jenis_kelamin,
      nama_wali: user.nama_wali,
      no_wali: user.no_wali,
      tanggal_lahir: user.tanggal_lahir,
      tahun_lahir: user.tahun_lahir,
      status: user.status,
      created_at: user.created_at,
      updated_at: user.updated_at,
      sabuk_saat_ini: user.belt_id
        ? { id: user.belt_id, name: user.belt_name }
        : null,
    };

    return res.status(200).json({
      success: true,
      message: "Detail user pending berhasil diambil",
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil detail user pending",
      error: error.message,
    });
  }
};
