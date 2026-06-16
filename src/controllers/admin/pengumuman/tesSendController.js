const { client } = require("../../../services/whatsapp.service");

exports.sendTest = async (req, res) => {
  try {
    const { groupId, message } = req.body;

    await client.sendMessage(groupId, message);

    return res.json({
      success: true,
      message: "Pesan berhasil dikirim",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
