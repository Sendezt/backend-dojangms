const db = require("../../../config/database");

exports.getWhatsappGroupById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id < 1) {
      return res.status(400).json({ message: "ID grup tidak valid" });
    }

    const [rows] = await db.query(
      `SELECT 
         wg.id,
         wg.nama_grup,
         wg.group_jid,
         wg.kelas_id,
         k.nama AS kelas_nama,
         wg.status,
         wg.created_at
       FROM whatsapp_group wg
       LEFT JOIN kelas k ON wg.kelas_id = k.id
       WHERE wg.id = ?`,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Grup WhatsApp tidak ditemukan" });
    }

    const data = rows[0];
    return res.status(200).json({
      success: true,
      message: "Detail grup WhatsApp",
      data: {
        id: data.id,
        nama_grup: data.nama_grup,
        group_jid: data.group_jid,
        kelas_id: data.kelas_id,
        kelas_nama: data.kelas_nama,
        status: data.status,
        created_at: data.created_at,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil detail grup",
      error: error.message,
    });
  }
};
