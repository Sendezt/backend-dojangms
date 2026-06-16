const db = require("../../../config/database");
const ALLOWED_LIMITS = [10, 25, 50, 75, 100, 200];

exports.getDraftPengumuman = async (req, res) => {
  let page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || 10;
  const search = req.query.search?.trim() || null;

  if (!ALLOWED_LIMITS.includes(limit)) limit = 10;
  if (page < 1) page = 1;
  const offset = (page - 1) * limit;

  let where = ["p.status = 'draft'"];
  let params = [];

  if (search) {
    where.push("(p.judul LIKE ? OR p.isi LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }

  const whereClause = "WHERE " + where.join(" AND ");

  try {
    // 1. Count total draft
    const countQuery = `SELECT COUNT(*) as total FROM pengumuman p ${whereClause}`;
    const [[{ total }]] = await db.query(countQuery, params);
    const totalPages = Math.ceil(total / limit);

    // 2. Ambil data draft (urut dari yang paling lama)
    const dataQuery = `
      SELECT 
        p.id,
        p.judul,
        p.isi,
        p.target_type,
        p.target_role,
        p.kelas_id,
        p.status,
        p.scheduled_at,
        p.kirim_whatsapp,
        p.created_at,
        u.name AS dibuat_oleh_nama
      FROM pengumuman p
      LEFT JOIN users u ON p.dibuat_oleh = u.id
      ${whereClause}
      ORDER BY p.created_at ASC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await db.query(dataQuery, [...params, limit, offset]);

    // 3. Ambil target user untuk tipe individu
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

    // 4. Format data
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
      scheduled_at: row.scheduled_at,
      kirim_whatsapp: row.kirim_whatsapp === 1,
      created_at: row.created_at,
      dibuat_oleh: {
        id: row.dibuat_oleh,
        nama: row.dibuat_oleh_nama,
      },
    }));

    return res.status(200).json({
      success: true,
      message: data.length
        ? "Berhasil mengambil draft pengumuman"
        : "Tidak ada draft pengumuman",
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
      message: "Gagal mengambil draft pengumuman",
      error: error.message,
    });
  }
};
