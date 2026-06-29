// src/controllers/whatsapp/TestWhatsappController.js

const {
  isClientReady,
  sendMessage,
} = require("../../../services/whatsapp.service");

exports.sendTest = async (req, res) => {
  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({
        success: false,
        message: "Nomor WhatsApp dan pesan wajib diisi.",
      });
    }

    if (!isClientReady()) {
      return res.status(503).json({
        success: false,
        message: "WhatsApp belum terhubung.",
      });
    }

    await sendMessage(phone, message);

    return res.status(200).json({
      success: true,
      message: "Pesan WhatsApp berhasil dikirim.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Gagal mengirim WhatsApp.",
      error: error.message,
    });
  }
};
