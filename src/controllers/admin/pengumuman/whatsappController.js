// src/controllers/admin/pengumuman/whatsappController.js
const {
  getChats,
  isClientReady,
  getWhatsappStatus,
} = require("../../../services/whatsapp.service");

exports.getGroups = async (req, res) => {
  try {
    if (!isClientReady()) {
      return res.status(503).json({
        success: false,
        message: "WhatsApp client belum siap",
      });
    }

    const chats = await getChats();
    const groups = chats
      .filter((chat) => chat.isGroup)
      .map((group) => ({
        id: group.id._serialized,
        name: group.name,
      }));

    res.json({
      success: true,
      data: groups,
    });
  } catch (err) {
    console.error("[WA] getGroups:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getStatus = async (req, res) => {
  try {
    const status = await getWhatsappStatus();
    res.json({
      success: true,
      data: status,
    });
  } catch (err) {
    console.error("[WA] getStatus:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
