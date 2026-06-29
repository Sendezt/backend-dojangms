// src/controllers/auth/activateController.js
const db = require("../../config/database");
const { sendMessageWithDocument } = require("../../services/whatsapp.service");
const { activationMessage } = require("../../helpers/whatsapp.helper");
const { generateRegistrationPDF } = require("../../services/pdf.service");

exports.activateUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId) || userId < 1) {
      return res
        .status(400)
        .json({ success: false, message: "ID user tidak valid" });
    }

    // Ambil data user LENGKAP (termasuk alamat, jenis_kelamin, dll)
    const [users] = await db.query(
      `SELECT u.id, u.name, u.email, u.phone, u.status, u.tanggal_lahir, u.alamat, u.jenis_kelamin, u.nama_wali, u.no_wali, r.name AS role
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

    // Ubah status menjadi active
    await db.query("UPDATE users SET status = 'active' WHERE id = ?", [userId]);

    // 1. Buat pesan WhatsApp dari helper
    const message = activationMessage(user);

    // 2. Generate PDF formulir
    const pdfPath = await generateRegistrationPDF(user);

    // 3. Kirim pesan + PDF via WhatsApp
    let phoneNumber = user.phone;
    if (phoneNumber.startsWith("0")) {
      phoneNumber = `62${phoneNumber.slice(1)}`; // format internasional
    }
    await sendMessageWithDocument(phoneNumber, message, pdfPath);

    // Ambil data terbaru
    const [updated] = await db.query(
      `SELECT id, name, email, phone, status FROM users WHERE id = ?`,
      [userId],
    );

    return res.status(200).json({
      success: true,
      message: "User berhasil diaktifkan, WhatsApp dan PDF telah dikirim",
      data: updated[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal aktivasi",
      error: error.message,
    });
  }
};
