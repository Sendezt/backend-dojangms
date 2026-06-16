// src/controllers/admin/pengumuman/getPengumumanByIdController.js
const db = require("../../../config/database");

exports.getPengumumanById = async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id < 1) {
    return res.status(400).json({ message: "ID tidak valid" });
  }

  try {
    // 1. Ambil data pengumuman utama
    const [rows] = await db.query(
      `SELECT 
         p.id,
         p.judul,
         p.isi,
         p.target_type,
         p.target_role,
         p.kelas_id,
         p.status,
         p.tanggal_publish,
         p.scheduled_at,
         p.kirim_whatsapp,
         p.created_at,
         u.name AS dibuat_oleh_nama
       FROM pengumuman p
       LEFT JOIN users u ON p.dibuat_oleh = u.id
       WHERE p.id = ?`,
      [id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Pengumuman tidak ditemukan" });
    }
    const row = rows[0];

    // 2. Ambil target user jika tipe individu
    let targetUserIds = [];
    if (row.target_type === "individu") {
      const [users] = await db.query(
        "SELECT user_id FROM pengumuman_target_user WHERE pengumuman_id = ?",
        [id],
      );
      targetUserIds = users.map((u) => u.user_id);
    }

    // 3. Ambil statistik WhatsApp
    const [whatsappStats] = await db.query(
      `SELECT 
         COUNT(*) AS total_grup,
         SUM(CASE WHEN status = 'terkirim' THEN 1 ELSE 0 END) AS terkirim,
         SUM(CASE WHEN status = 'gagal' THEN 1 ELSE 0 END) AS gagal,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending
       FROM pengumuman_whatsapp_log
       WHERE pengumuman_id = ?`,
      [id],
    );
    const stats = whatsappStats[0] || {
      total_grup: 0,
      terkirim: 0,
      gagal: 0,
      pending: 0,
    };

    // 4. Ambil daftar grup WhatsApp yang dikirim (jika ada)
    let whatsappGroups = [];
    if (row.kirim_whatsapp) {
      const [groups] = await db.query(
        `SELECT 
           wg.id,
           wg.nama_grup,
           wg.group_jid,
           pwl.status,
           pwl.sent_at,
           pwl.error_message
         FROM pengumuman_whatsapp_log pwl
         JOIN whatsapp_group wg ON pwl.whatsapp_group_id = wg.id
         WHERE pwl.pengumuman_id = ?
         ORDER BY wg.nama_grup ASC`,
        [id],
      );
      whatsappGroups = groups;
    }

    // 5. Format response
    const data = {
      id: row.id,
      judul: row.judul,
      isi: row.isi,
      target: {
        target_type: row.target_type,
        target_role: row.target_role || null,
        kelas_id: row.kelas_id || null,
        target_user_ids: targetUserIds.length > 0 ? targetUserIds : null,
      },
      status: row.status,
      tanggal_publish: row.tanggal_publish,
      scheduled_at: row.scheduled_at,
      kirim_whatsapp: row.kirim_whatsapp === 1,
      created_at: row.created_at,
      dibuat_oleh: {
        id: row.dibuat_oleh,
        nama: row.dibuat_oleh_nama,
      },
      whatsapp: {
        dikirim: row.kirim_whatsapp === 1,
        statistik: stats,
        daftar_grup: whatsappGroups,
      },
    };

    return res.status(200).json({
      success: true,
      message: "Detail pengumuman berhasil diambil",
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil detail pengumuman",
      error: error.message,
    });
  }
};
