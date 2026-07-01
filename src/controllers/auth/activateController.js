// src/controllers/auth/activateController.js
const db = require("../../config/database");
const {
  sendMessageWithDocument,
  isClientReady,
  isPhoneRegistered,
} = require("../../services/whatsapp.service");
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

    // Ambil data user LENGKAP
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

    // ============================================================
    // 1. VALIDASI NOMOR TELEPON
    // ============================================================
    if (!user.phone) {
      return res.status(400).json({
        success: false,
        message:
          "Nomor telepon tidak tersedia, tidak dapat melanjutkan aktivasi",
      });
    }

    // Format nomor: bersihkan dan ubah 0 di depan menjadi 62
    let phoneNumber = user.phone.replace(/\D/g, "");
    if (phoneNumber.startsWith("0")) {
      phoneNumber = "62" + phoneNumber.slice(1);
    }

    // ============================================================
    // 2. CEK KONEKSI WHATSAPP CLIENT
    // ============================================================
    if (!isClientReady()) {
      return res.status(503).json({
        success: false,
        message: "WhatsApp client tidak siap, coba lagi nanti.",
      });
    }

    // ============================================================
    // 3. CEK APAKAH NOMOR TERDAFTAR DI WHATSAPP
    // ============================================================
    let isRegistered = false;
    try {
      isRegistered = await isPhoneRegistered(phoneNumber, 15000); // timeout 15 detik
    } catch (checkErr) {
      const statusCode =
        checkErr.code === "WA_CLIENT_UNSTABLE" ||
        checkErr.code === "WA_CLIENT_NOT_READY"
          ? 503
          : 500;

      return res.status(statusCode).json({
        success: false,
        message: `Gagal memverifikasi nomor WhatsApp: ${checkErr.message}`,
      });
    }

    if (!isRegistered) {
      return res.status(400).json({
        success: false,
        message:
          "Nomor WhatsApp tidak terdaftar. Aktivasi dibatalkan. Pastikan nomor sudah terdaftar di WhatsApp.",
      });
    }

    // 4. Buat pesan dan generate PDF
    const message = activationMessage(user);
    const pdfPath = await generateRegistrationPDF(user);

    // 5. Kirim pesan + PDF via WhatsApp
    await sendMessageWithDocument(phoneNumber, message, pdfPath);

    // 6. Jika WhatsApp berhasil terkirim, baru aktifkan user
    await db.query("UPDATE users SET status = 'active' WHERE id = ?", [userId]);

    // 7. Ambil data terbaru
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
