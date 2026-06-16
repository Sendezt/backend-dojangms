// src/helpers/announcementHelper.js
const db = require("../config/database");
const { client } = require("../services/whatsapp.service");

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

  // 2. Kirim notifikasi in-app (bulk insert)
  if (targetUserIds.length > 0) {
    // Buat values string: (user_id, ?, ?, 'pengumuman', ?, NOW())
    // Karena judul, isi, id sama untuk semua, kita gunakan parameter binding
    // Namun kita perlu menulis query dengan banyak placeholder.
    // Lebih mudah: gunakan satu query dengan banyak baris VALUES.
    const rows = targetUserIds
      .map(() => "(?, ?, ?, 'pengumuman', ?, NOW())")
      .join(",");
    // Parameternya: untuk setiap baris butuh 4 parameter (user_id, judul, isi, referensi_id)
    // Kita buat array parameter: [user_id1, judul, isi, id, user_id2, judul, isi, id, ...]
    const params = [];
    for (const uid of targetUserIds) {
      params.push(uid, judul, isi, id);
    }
    await conn.query(
      `INSERT INTO notifikasi (user_id, judul, pesan, tipe, referensi_id, created_at)
       VALUES ${rows}`,
      params,
    );
  }

  // 3. Kirim WhatsApp (hanya jika target_type = global dan kirim_whatsapp = true)
  // Di bagian WhatsApp
  if (kirim_whatsapp && target_type === "global") {
    let groups = [];

    if (announcement.whatsapp_group_id) {
      // Kirim ke satu grup tertentu
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

    const waMessage = `📢 *${judul}*\n\n${isi}`;

    for (const group of groups) {
      try {
        // Simpan log pending
        await conn.query(
          `INSERT INTO pengumuman_whatsapp_log (pengumuman_id, whatsapp_group_id, status)
           VALUES (?, ?, 'pending')`,
          [id, group.id],
        );

        // Kirim pesan
        await client.sendMessage(group.group_jid, waMessage);

        // Update log sukses
        await conn.query(
          `UPDATE pengumuman_whatsapp_log SET status = 'terkirim', sent_at = NOW()
           WHERE pengumuman_id = ? AND whatsapp_group_id = ?`,
          [id, group.id],
        );
      } catch (error) {
        // Update log gagal
        await conn.query(
          `UPDATE pengumuman_whatsapp_log SET status = 'gagal', error_message = ?
           WHERE pengumuman_id = ? AND whatsapp_group_id = ?`,
          [error.message, id, group.id],
        );
        console.error(
          `Gagal kirim WhatsApp ke grup ${group.group_jid}:`,
          error.message,
        );
      }
    }
  }

  // Update tanggal_publish
  await conn.query(
    `UPDATE pengumuman SET tanggal_publish = NOW() WHERE id = ?`,
    [id],
  );
}

module.exports = { sendAnnouncement };
