// src/controllers/admin/kejuaraan/getAllKelasPoomsaeController.js
const db = require("../../../config/database");
const ALLOWED_LIMITS = [10, 25, 50, 75, 100, 200];

exports.getAllKelasPoomsae = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim() || null;
    const gender = req.query.gender?.trim() || null;
    const kategori_usia_id = req.query.kategori_usia_id
      ? parseInt(req.query.kategori_usia_id)
      : null;
    const level_kelas_id = req.query.level_kelas_id
      ? parseInt(req.query.level_kelas_id)
      : null;
    const jurus_id = req.query.jurus_id ? parseInt(req.query.jurus_id) : null;
    const format_id = req.query.format_id
      ? parseInt(req.query.format_id)
      : null;

    if (!ALLOWED_LIMITS.includes(limit)) limit = 10;
    if (page < 1) page = 1;
    const offset = (page - 1) * limit;

    let where = [];
    let params = [];

    if (gender && (gender === "putra" || gender === "putri")) {
      where.push("kp.gender = ?");
      params.push(gender);
    }
    if (kategori_usia_id) {
      where.push("kp.kategori_usia_id = ?");
      params.push(kategori_usia_id);
    }
    if (level_kelas_id) {
      where.push("kp.level_kelas_id = ?");
      params.push(level_kelas_id);
    }
    if (jurus_id) {
      where.push("kp.jurus_id = ?");
      params.push(jurus_id);
    }
    if (format_id) {
      where.push("kp.format_id = ?");
      params.push(format_id);
    }
    if (search) {
      where.push("(pj.name LIKE ? OR pf.name LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = where.length ? "WHERE " + where.join(" AND ") : "";

    // Count total
    const countQuery = `SELECT COUNT(*) as total FROM kelas_poomsae kp ${whereClause}`;
    const [[{ total }]] = await db.query(countQuery, params);
    const totalPages = Math.ceil(total / limit);

    // Data
    const dataQuery = `
      SELECT 
        kp.id,
        kp.gender,
        kp.kategori_usia_id,
        ku.name AS kategori_usia_nama,
        kp.level_kelas_id,
        lk.name AS level_kelas_nama,
        kp.jurus_id,
        pj.name AS jurus_nama,
        kp.format_id,
        pf.name AS format_nama
      FROM kelas_poomsae kp
      JOIN kategori_usia ku ON ku.id = kp.kategori_usia_id
      JOIN level_kelas lk ON lk.id = kp.level_kelas_id
      JOIN poomsae_jurus pj ON pj.id = kp.jurus_id
      JOIN poomsae_format pf ON pf.id = kp.format_id
      ${whereClause}
      ORDER BY kp.id ASC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await db.query(dataQuery, [...params, limit, offset]);

    const data = rows.map((row) => ({
      id: row.id,
      gender: row.gender,
      kategori_usia: { id: row.kategori_usia_id, nama: row.kategori_usia_nama },
      level_kelas: { id: row.level_kelas_id, nama: row.level_kelas_nama },
      jurus: { id: row.jurus_id, nama: row.jurus_nama },
      format: { id: row.format_id, nama: row.format_nama },
    }));

    res.status(200).json({
      success: true,
      message: data.length
        ? "Berhasil mengambil data kelas poomsae"
        : "Data kelas poomsae masih kosong",
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
    res
      .status(500)
      .json({
        success: false,
        message: "Gagal mengambil data kelas poomsae",
        error: error.message,
      });
  }
};
