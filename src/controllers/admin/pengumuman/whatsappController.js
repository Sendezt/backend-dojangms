// src\controllers\admin\pengumuman\whatsappController.js
const {
  getChats,
  isClientReady,
  getWhatsappStatus,
} = require("../../../services/whatsapp.service");

exports.getGroups = async (req, res) => {
  try {
    if (!isClientReady()) {
      return res.status(503).json({
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

    res.json(groups);
  } catch (err) {
    console.error("[WA] getGroups:", err);

    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getStatus = (req, res) => {
  res.json(getWhatsappStatus());
};
