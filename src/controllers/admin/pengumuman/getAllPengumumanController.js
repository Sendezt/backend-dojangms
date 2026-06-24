// src/controllers/admin/pengumuman/getAllPengumumanController.js
const db = require("../../../config/database");
const ALLOWED_LIMITS = [10, 25, 50, 75, 100, 200];

exports.getAllPengumuman = async (req, res) => {
  let page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || 10;
  const search = req.query.search?.trim() || null;
  const status = req.query.status || null;
  const target_type = req.query.target_type || null;

  if (!ALLOWED_LIMITS.includes(limit)) limit = 10;
  if (page < 1) page = 1;
  const offset = (page - 1) * limit;

  let where = [];
  let params = [];

  if (search) {
    where.push("(judul LIKE ? OR isi LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  if (status && ["draft", "terjadwal", "terkirim"].includes(status)) {
    where.push("status = ?");
    params.push(status);
  }
  if (
    target_type &&
    ["global", "role", "kelas", "individu"].includes(target_type)
  ) {
    where.push("target_type = ?");
    params.push(target_type);
  }

  const whereClause = where.length ? "WHERE " + where.join(" AND ") : "";

  try {
    // 1. Count total (untuk pagination)
    const countQuery = `SELECT COUNT(*) as total FROM pengumuman ${whereClause}`;
    const [[{ total }]] = await db.query(countQuery, params);
    const totalPages = Math.ceil(total / limit);

    // 2. Summary per status (tanpa filter status, tapi tetap pakai search & target_type)
    let summaryWhere = [];
    let summaryParams = [];

    if (search) {
      summaryWhere.push("(judul LIKE ? OR isi LIKE ?)");
      summaryParams.push(`%${search}%`, `%${search}%`);
    }
    if (
      target_type &&
      ["global", "role", "kelas", "individu"].includes(target_type)
    ) {
      summaryWhere.push("target_type = ?");
      summaryParams.push(target_type);
    }

    const summaryClause = summaryWhere.length
      ? "WHERE " + summaryWhere.join(" AND ")
      : "";

    const summaryQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
        SUM(CASE WHEN status = 'terjadwal' THEN 1 ELSE 0 END) as terjadwal,
        SUM(CASE WHEN status = 'terkirim' THEN 1 ELSE 0 END) as terkirim
      FROM pengumuman ${summaryClause}
    `;
    const [summaryRows] = await db.query(summaryQuery, summaryParams);
    const summary = summaryRows[0] || {
      total: 0,
      draft: 0,
      terjadwal: 0,
      terkirim: 0,
    };

    // 3. Ambil data utama (dengan pagination)
    const dataQuery = `
      SELECT 
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
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await db.query(dataQuery, [...params, limit, offset]);

    // 4. Ambil info tambahan (target user untuk individu, statistik WA)
    const ids = rows.map((r) => r.id);
    let targetUsersMap = {};
    if (ids.length > 0) {
      const [targetUsers] = await db.query(
        `SELECT pengumuman_id, user_id FROM pengumuman_target_user WHERE pengumuman_id IN (?)`,
        [ids],
      );
      for (const tu of targetUsers) {
        if (!targetUsersMap[tu.pengumuman_id])
          targetUsersMap[tu.pengumuman_id] = [];
        targetUsersMap[tu.pengumuman_id].push(tu.user_id);
      }
    }

    let whatsappStatsMap = {};
    if (ids.length > 0) {
      const [whatsappStats] = await db.query(
        `SELECT 
           pengumuman_id,
           COUNT(*) AS total_grup,
           SUM(CASE WHEN status = 'terkirim' THEN 1 ELSE 0 END) AS terkirim,
           SUM(CASE WHEN status = 'gagal' THEN 1 ELSE 0 END) AS gagal,
           SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending
         FROM pengumuman_whatsapp_log
         WHERE pengumuman_id IN (?)
         GROUP BY pengumuman_id`,
        [ids],
      );
      for (const stat of whatsappStats) {
        whatsappStatsMap[stat.pengumuman_id] = {
          total_grup: stat.total_grup,
          terkirim: stat.terkirim,
          gagal: stat.gagal,
          pending: stat.pending,
        };
      }
    }

    // 5. Format data
    const data = rows.map((row) => ({
      id: row.id,
      judul: row.judul,
      isi: row.isi,
      target: {
        target_type: row.target_type,
        target_role: row.target_role || null,
        kelas_id: row.kelas_id || null,
        target_user_ids: targetUsersMap[row.id] || null,
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
        statistik: whatsappStatsMap[row.id] || {
          total_grup: 0,
          terkirim: 0,
          gagal: 0,
          pending: 0,
        },
      },
    }));

    return res.status(200).json({
      success: true,
      message: "Berhasil mengambil daftar pengumuman",
      summary,
      data,
      meta: {
        pagination: {
          current_page: page,
          per_page: limit,
          total_page: totalPages,
          total_data: total,
          has_next: page < totalPages,
          has_prev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil daftar pengumuman",
      error: error.message,
    });
  }
};
