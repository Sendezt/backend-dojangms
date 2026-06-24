// src/helpers/announcementHelper.js
const db = require("../config/database");
const { sendMessage, isClientReady } = require("../services/whatsapp.service");

async function sendAnnouncement(conn, announcement) {
  const {
    id,
    judul,
    isi,
    target_type,
    target_role,
    kelas_id,
    kirim_whatsapp,
    whatsapp_scope,
  } = announcement;

  const scope = announcement.whatsapp_scope || null;

  console.log(`[Helper] Sending announcement ID ${id} to ${target_type}`);

  // 1. Tentukan target user
  let targetUserIds = [];
  if (target_type === "global") {
    const [users] = await conn.query(
      "SELECT id FROM users WHERE status = 'active'",
    );
    targetUserIds = users.map((u) => u.id);
  } else if (target_type === "role") {
    const [users] = await conn.query(
      `SELECT u.id FROM users u
       JOIN user_roles ur ON u.id = ur.user_id
       JOIN roles r ON ur.role_id = r.id
       WHERE u.status = 'active' AND r.name = ?`,
      [target_role],
    );
    targetUserIds = users.map((u) => u.id);
  } else if (target_type === "kelas") {
    const [users] = await conn.query(
      `SELECT u.id FROM users u
       JOIN kelas_murid km ON u.id = km.user_id
       WHERE u.status = 'active' AND km.kelas_id = ? AND km.status = 'aktif'`,
      [kelas_id],
    );
    targetUserIds = users.map((u) => u.id);
  } else if (target_type === "individu") {
    const [users] = await conn.query(
      `SELECT user_id FROM pengumuman_target_user WHERE pengumuman_id = ?`,
      [id],
    );
    targetUserIds = users.map((u) => u.user_id);
  }

  console.log(`[Helper] Target users count: ${targetUserIds.length}`);

  // 2. Kirim notifikasi in-app
  if (targetUserIds.length > 0) {
    const rows = targetUserIds
      .map(() => "(?, ?, ?, 'pengumuman', ?, NOW())")
      .join(",");
    const params = [];
    for (const uid of targetUserIds) {
      params.push(uid, judul, isi, id);
    }
    await conn.query(
      `INSERT INTO notifikasi (user_id, judul, pesan, tipe, referensi_id, created_at)
       VALUES ${rows}`,
      params,
    );
    console.log(
      `[Helper] In-app notifications sent to ${targetUserIds.length} users`,
    );
  }

  // 3. Kirim WhatsApp (hanya global)
  if (kirim_whatsapp && target_type === "global") {
    // Cek status client WhatsApp
    if (!isClientReady()) {
      console.warn(
        `[Helper] WhatsApp client belum siap, lewati pengiriman WA untuk pengumuman ${id}`,
      );
      // Catat di log sebagai pending agar bisa di-retry nanti
      // Kita tetap akan insert log untuk setiap grup dengan status 'pending'
      let groups = [];
      if (announcement.whatsapp_group_id) {
        const [rows] = await conn.query(
          "SELECT id, group_jid FROM whatsapp_group WHERE id = ? AND status = 'aktif'",
          [announcement.whatsapp_group_id],
        );
        groups = rows;
      } else if (whatsapp_scope === "grup_besar_saja") {
        const [rows] = await conn.query(
          "SELECT id, group_jid FROM whatsapp_group WHERE status = 'aktif' AND kelas_id IS NULL",
        );
        groups = rows;
      } else if (whatsapp_scope === "semua_grup") {
        const [rows] = await conn.query(
          "SELECT id, group_jid FROM whatsapp_group WHERE status = 'aktif'",
        );
        groups = rows;
      }
      // Insert log pending
      for (const group of groups) {
        await conn.query(
          `INSERT INTO pengumuman_whatsapp_log (pengumuman_id, whatsapp_group_id, status, error_message)
           VALUES (?, ?, 'pending', 'Client tidak siap')`,
          [id, group.id],
        );
      }
      console.log(
        `[Helper] ${groups.length} WA log entries created as pending`,
      );
      // Selesai, tidak perlu kirim
      // Update tanggal_publish tetap dilakukan
      await conn.query(
        `UPDATE pengumuman SET tanggal_publish = NOW() WHERE id = ?`,
        [id],
      );
      console.log(`[Helper] Announcement ID ${id} publish date updated.`);
      return; // keluar dari helper
    }

    // Client siap, lanjutkan kirim
    console.log("[Helper] Sending WhatsApp...");
    let groups = [];
    if (announcement.whatsapp_group_id) {
      const [rows] = await conn.query(
        "SELECT id, group_jid FROM whatsapp_group WHERE id = ? AND status = 'aktif'",
        [announcement.whatsapp_group_id],
      );
      groups = rows;
    } else if (whatsapp_scope === "grup_besar_saja") {
      const [rows] = await conn.query(
        "SELECT id, group_jid FROM whatsapp_group WHERE status = 'aktif' AND kelas_id IS NULL",
      );
      groups = rows;
    } else if (whatsapp_scope === "semua_grup") {
      const [rows] = await conn.query(
        "SELECT id, group_jid FROM whatsapp_group WHERE status = 'aktif'",
      );
      groups = rows;
    } else {
      console.log(`[Helper] Unknown whatsapp_scope: ${whatsapp_scope}`);
    }

    console.log(`[Helper] Found ${groups.length} WhatsApp groups`);
    const waMessage = `📢 *${judul}*\n\n${isi}`;

    for (const group of groups) {
      // Insert log pending
      await conn.query(
        `INSERT INTO pengumuman_whatsapp_log (pengumuman_id, whatsapp_group_id, status)
         VALUES (?, ?, 'pending')`,
        [id, group.id],
      );

      // Kirim menggunakan sendMessage dari service
      const result = await sendMessage(group.group_jid, waMessage);
      if (result.success) {
        await conn.query(
          `UPDATE pengumuman_whatsapp_log SET status = 'terkirim', sent_at = NOW()
           WHERE pengumuman_id = ? AND whatsapp_group_id = ?`,
          [id, group.id],
        );
        console.log(`[Helper] WA sent to group ${group.group_jid}`);
      } else {
        await conn.query(
          `UPDATE pengumuman_whatsapp_log SET status = 'gagal', error_message = ?
           WHERE pengumuman_id = ? AND whatsapp_group_id = ?`,
          [result.error, id, group.id],
        );
        console.error(
          `[Helper] WA failed for ${group.group_jid}:`,
          result.error,
        );
      }
    }
  }

  // Update tanggal_publish
  await conn.query(
    `UPDATE pengumuman SET tanggal_publish = NOW() WHERE id = ?`,
    [id],
  );
  console.log(`[Helper] Announcement ID ${id} publish date updated.`);
}

module.exports = { sendAnnouncement };
