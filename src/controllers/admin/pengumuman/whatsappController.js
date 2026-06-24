// src\controllers\admin\pengumuman\whatsappController.js
const { client } = require("../../../services/whatsapp.service");

exports.getGroups = async (req, res) => {
  try {
    const chats = await client.getChats();

    const groups = chats
      .filter((chat) => chat.isGroup)
      .map((group) => ({
        id: group.id._serialized,
        name: group.name,
      }));

    res.json(groups);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
