// src\controllers\auth\rejectController.js
const db = require("../../config/database");

exports.rejectUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId) || userId < 1) {
      return res
        .status(400)
        .json({ success: false, message: "ID user tidak valid" });
    }

    // Ambil alasan penolakan dari body request
    const { alasan_reject } = req.body;
    if (!alasan_reject || alasan_reject.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Alasan penolakan harus diisi",
      });
    }

    // Cek user pending (hanya untuk role murid)
    const [users] = await db.query(
      `SELECT u.id, u.name, u.email, u.phone, u.status, r.name AS role
       FROM users u
       JOIN user_roles ur ON ur.user_id = u.id
       JOIN roles r ON r.id = ur.role_id
       WHERE u.id = ? AND r.name = 'murid' AND u.status = 'pending'`,
      [userId],
    );

    if (users.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User pending tidak ditemukan" });
    }

    const user = users[0];

    // Ubah status menjadi rejected dan simpan alasan
    await db.query(
      "UPDATE users SET status = 'rejected', alasan_reject = ? WHERE id = ?",
      [alasan_reject.trim(), userId],
    );

    return res.status(200).json({
      success: true,
      message: "Pendaftaran ditolak",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: "rejected",
        alasan_reject: alasan_reject.trim(), // tambahkan alasan di response
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal menolak pendaftaran",
      error: error.message,
    });
  }
};
