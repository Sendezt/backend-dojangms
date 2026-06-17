// src/controllers/admin/whatsapp/getAllWhatsappGroupsController.js
const db = require("../../../config/database");
const ALLOWED_LIMITS = [10, 25, 50, 75, 100, 200];

exports.getAllWhatsappGroups = async (req, res) => {
  let page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || 10;
  const search = req.query.search?.trim() || null;
  const status = req.query.status || null; // 'aktif' / 'nonaktif'

  if (!ALLOWED_LIMITS.includes(limit)) limit = 10;
  if (page < 1) page = 1;
  const offset = (page - 1) * limit;

  let where = [];
  let params = [];

  if (search) {
    where.push("(nama_grup LIKE ? OR group_jid LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  if (status && ["aktif", "nonaktif"].includes(status)) {
    where.push("status = ?");
    params.push(status);
  }

  const whereClause = where.length ? "WHERE " + where.join(" AND ") : "";

  try {
    // Count total
    const countQuery = `SELECT COUNT(*) as total FROM whatsapp_group ${whereClause}`;
    const [[{ total }]] = await db.query(countQuery, params);
    const totalPages = Math.ceil(total / limit);

    // Ambil data
    const dataQuery = `
      SELECT 
        wg.id,
        wg.nama_grup,
        wg.group_jid,
        wg.kelas_id,
        k.nama AS kelas_nama,
        wg.status,
        wg.created_at
      FROM whatsapp_group wg
      LEFT JOIN kelas k ON wg.kelas_id = k.id
      ${whereClause}
      ORDER BY wg.nama_grup ASC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await db.query(dataQuery, [...params, limit, offset]);

    const data = rows.map((row) => ({
      id: row.id,
      nama_grup: row.nama_grup,
      group_jid: row.group_jid,
      kelas_id: row.kelas_id,
      kelas_nama: row.kelas_nama,
      status: row.status,
      created_at: row.created_at,
    }));

    return res.status(200).json({
      success: true,
      message: data.length
        ? "Berhasil mengambil data grup"
        : "Tidak ada data grup",
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
      message: "Gagal mengambil data grup WhatsApp",
      error: error.message,
    });
  }
};
