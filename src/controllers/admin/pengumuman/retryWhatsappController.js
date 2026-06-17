// src/controllers/admin/pengumuman/retryWhatsappController.js
const db = require("../../../config/database");
const { sendMessage } = require("../../../services/whatsapp.service");

exports.retryWhatsapp = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id < 1) {
      return res.status(400).json({ message: "ID pengumuman tidak valid" });
    }

    // Cek pengumuman
    const [pengumuman] = await conn.query(
      `SELECT id, judul, isi FROM pengumuman WHERE id = ?`,
      [id],
    );
    if (pengumuman.length === 0) {
      return res.status(404).json({ message: "Pengumuman tidak ditemukan" });
    }
    const ann = pengumuman[0];

    // Ambil log WA yang gagal
    const [failedLogs] = await conn.query(
      `SELECT pwl.id, pwl.whatsapp_group_id, wg.group_jid
       FROM pengumuman_whatsapp_log pwl
       JOIN whatsapp_group wg ON pwl.whatsapp_group_id = wg.id
       WHERE pwl.pengumuman_id = ? AND pwl.status = 'gagal'`,
      [id],
    );

    if (failedLogs.length === 0) {
      return res.status(404).json({
        message: "Tidak ada grup dengan status gagal untuk pengumuman ini",
      });
    }

    const waMessage = `📢 *${ann.judul}*\n\n${ann.isi}`;
    let successCount = 0;
    let errorCount = 0;

    for (const log of failedLogs) {
      const result = await sendMessage(log.group_jid, waMessage);
      if (result.success) {
        await conn.query(
          `UPDATE pengumuman_whatsapp_log 
           SET status = 'terkirim', sent_at = NOW(), error_message = NULL
           WHERE id = ?`,
          [log.id],
        );
        successCount++;
      } else {
        await conn.query(
          `UPDATE pengumuman_whatsapp_log 
           SET status = 'gagal', error_message = ?
           WHERE id = ?`,
          [result.error, log.id],
        );
        errorCount++;
      }
    }

    res.status(200).json({
      message: "Proses retry selesai",
      success_count: successCount,
      error_count: errorCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Gagal melakukan retry WhatsApp",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
