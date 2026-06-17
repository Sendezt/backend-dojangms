// src/controllers/internal/processScheduledAnnouncementsController.js
const db = require("../../config/database");
const { sendAnnouncement } = require("../../helpers/announcementHelper");

exports.processScheduledAnnouncements = async (req, res) => {
  const secret = req.headers["x-internal-secret"];
  console.log(
    "[Internal] Received request, secret:",
    secret ? "present" : "missing",
  );
  if (!secret || secret !== process.env.INTERNAL_API_SECRET) {
    console.log("[Internal] Secret mismatch or missing");
    return res.status(403).json({ message: "Forbidden" });
  }

  const conn = await db.getConnection();
  try {
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    // console.log(`[Internal] Checking scheduled_at <= ${now}`);
    const [announcements] = await conn.query(
      `SELECT id, judul, isi, target_type, target_role, kelas_id, 
          kirim_whatsapp, whatsapp_scope
   FROM pengumuman 
   WHERE status = 'terjadwal' AND scheduled_at <= NOW()`,
    );
    console.log(
      `[Internal] Found ${announcements.length} announcements to process`,
    );

    let processed = 0;
    for (const ann of announcements) {
      console.log(
        `[Internal] Processing announcement ID ${ann.id}, scheduled at ${ann.scheduled_at}`,
      );
      await conn.beginTransaction();
      try {
        // Ubah status menjadi terkirim
        await conn.query(
          `UPDATE pengumuman SET status = 'terkirim' WHERE id = ?`,
          [ann.id],
        );
        // Kirim notifikasi & WA
        await sendAnnouncement(conn, ann);
        await conn.commit();
        processed++;
        console.log(
          `[Internal] Announcement ID ${ann.id} processed successfully`,
        );
      } catch (err) {
        await conn.rollback();
        console.error(
          `[Internal] Error processing announcement ID ${ann.id}:`,
          err.message,
        );
      }
    }

    res.status(200).json({ success: true, processed });
  } catch (error) {
    console.error("[Internal] Error:", error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    conn.release();
  }
};
