// src/controllers/admin/whatsapp/disableWhatsappGroupController.js
const db = require("../../../config/database");

exports.disableWhatsappGroup = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id < 1) {
      return res.status(400).json({ message: "ID grup tidak valid" });
    }

    // Cek keberadaan grup
    const [group] = await conn.query(
      "SELECT id, status FROM whatsapp_group WHERE id = ?",
      [id],
    );
    if (group.length === 0) {
      return res.status(404).json({ message: "Grup WhatsApp tidak ditemukan" });
    }

    if (group[0].status === "nonaktif") {
      return res
        .status(400)
        .json({ message: "Grup sudah dalam status nonaktif" });
    }

    // Ubah status menjadi nonaktif
    await conn.query(
      "UPDATE whatsapp_group SET status = 'nonaktif' WHERE id = ?",
      [id],
    );

    // Ambil data terbaru
    const [updated] = await conn.query(
      `SELECT wg.id, wg.nama_grup, wg.group_jid, wg.kelas_id, k.nama AS kelas_nama, wg.status, wg.created_at
       FROM whatsapp_group wg
       LEFT JOIN kelas k ON wg.kelas_id = k.id
       WHERE wg.id = ?`,
      [id],
    );

    return res.status(200).json({
      success: true,
      message: "Grup WhatsApp dinonaktifkan (soft delete)",
      data: updated[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal menonaktifkan grup WhatsApp",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
