const db = require("../../config/database");
const bcrypt = require("bcrypt");

/**
 * POST /api/auth/reset-password
 * Reset password tanpa verifikasi email (lupa password)
 * Body: { email, phone, new_password, confirm_password }
 */
exports.resetPasswordLupa = async (req, res) => {
  try {
    const { email, phone, new_password, confirm_password } = req.body;

    // Validasi input
    if (!email || !phone || !new_password || !confirm_password) {
      return res.status(400).json({
        success: false,
        message: "Email, phone, new_password, dan confirm_password wajib diisi",
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password baru minimal 6 karakter",
      });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: "Password baru dan konfirmasi tidak cocok",
      });
    }

    // Cek user berdasarkan email dan phone
    const [users] = await db.query(
      "SELECT id, email, phone FROM users WHERE email = ? AND phone = ? AND status = 'active'",
      [email, phone],
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Email dan nomor telepon tidak cocok atau akun tidak aktif",
      });
    }

    const user = users[0];

    // Hash password baru
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password
    await db.query("UPDATE users SET password = ? WHERE id = ?", [
      hashedPassword,
      user.id,
    ]);

    return res.status(200).json({
      success: true,
      message: "Password berhasil direset. Silakan login dengan password baru.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal reset password",
      error: error.message,
    });
  }
};
