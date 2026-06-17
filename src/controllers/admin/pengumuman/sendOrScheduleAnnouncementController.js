// src/controllers/admin/pengumuman/sendOrScheduleAnnouncementController.js
const db = require("../../../config/database");
const { sendAnnouncement } = require("../../../helpers/announcementHelper");

exports.sendOrScheduleAnnouncement = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id < 1) {
      return res.status(400).json({ message: "ID pengumuman tidak valid" });
    }

    const { action, scheduled_at } = req.body; // action: 'sekarang' atau 'terjadwal'

    // Validasi action
    if (!action || !["sekarang", "terjadwal"].includes(action)) {
      return res.status(400).json({
        message: "Action harus 'sekarang' atau 'terjadwal'",
      });
    }

    // Ambil data pengumuman
    const [rows] = await conn.query(
      `SELECT id, judul, isi, target_type, target_role, kelas_id,
              status, kirim_whatsapp, whatsapp_scope
       FROM pengumuman WHERE id = ?`,
      [id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Pengumuman tidak ditemukan" });
    }
    const pengumuman = rows[0];

    // Hanya bisa mengirim draft
    if (pengumuman.status !== "draft") {
      return res.status(400).json({
        message: "Hanya pengumuman dengan status draft yang dapat dikirim",
      });
    }

    // Jika action = terjadwal, wajib ada scheduled_at
    if (action === "terjadwal") {
      if (!scheduled_at || isNaN(Date.parse(scheduled_at))) {
        return res.status(400).json({
          message: "scheduled_at wajib diisi untuk action = terjadwal",
        });
      }
      if (new Date(scheduled_at) <= new Date()) {
        return res.status(400).json({
          message: "scheduled_at harus lebih besar dari waktu sekarang",
        });
      }
    }

    // Mulai transaction
    await conn.beginTransaction();

    if (action === "sekarang") {
      // Update status menjadi terkirim
      await conn.query(
        `UPDATE pengumuman SET status = 'terkirim' WHERE id = ?`,
        [id],
      );

      // Kirim notifikasi & WhatsApp (jika diaktifkan)
      await sendAnnouncement(conn, {
        id: pengumuman.id,
        judul: pengumuman.judul,
        isi: pengumuman.isi,
        target_type: pengumuman.target_type,
        target_role: pengumuman.target_role,
        kelas_id: pengumuman.kelas_id,
        kirim_whatsapp: pengumuman.kirim_whatsapp === 1,
        whatsapp_scope: pengumuman.whatsapp_scope,
        // tidak ada whatsapp_group_id karena dari draft
      });

      await conn.commit();

      return res.status(200).json({
        message: "Pengumuman berhasil dikirim",
        data: {
          id: pengumuman.id,
          status: "terkirim",
        },
      });
    } else if (action === "terjadwal") {
      // Update status menjadi terjadwal dan set scheduled_at
      await conn.query(
        `UPDATE pengumuman SET status = 'terjadwal', scheduled_at = ? WHERE id = ?`,
        [scheduled_at, id],
      );

      await conn.commit();

      return res.status(200).json({
        message: "Pengumuman dijadwalkan",
        data: {
          id: pengumuman.id,
          status: "terjadwal",
          scheduled_at,
        },
      });
    }
  } catch (error) {
    await conn.rollback();
    console.error(error);
    return res.status(500).json({
      message: "Gagal memproses pengumuman",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
