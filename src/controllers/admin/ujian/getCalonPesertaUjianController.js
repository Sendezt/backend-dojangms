// src/controllers/admin/ujian/getCalonPesertaUjianController.js
const db = require("../../../config/database");
const ALLOWED_LIMITS = [10, 25, 50, 75, 100, 200];

exports.getCalonPesertaUjian = async (req, res) => {
  try {
    const ujianId = parseInt(req.params.ujianId);
    if (isNaN(ujianId) || ujianId < 1) {
      return res.status(400).json({ message: "ID ujian tidak valid" });
    }

    // Cek ujian dan level-nya
    const [ujianRows] = await db.query(
      "SELECT id, level_ujian FROM ujian_sabuk WHERE id = ? AND deleted_at IS NULL",
      [ujianId],
    );
    if (ujianRows.length === 0) {
      return res
        .status(404)
        .json({ message: "Ujian tidak ditemukan atau sudah dihapus" });
    }
    const levelUjian = ujianRows[0].level_ujian; // 'kota' atau 'provinsi'

    // Tentukan range order_level yang diperbolehkan
    let minOrder = 1;
    let maxOrder = 7; // default untuk kota
    if (levelUjian === "provinsi") {
      minOrder = 8;
      maxOrder = 15; // DAN V
    }

    // Pagination
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim() || null;

    if (!ALLOWED_LIMITS.includes(limit)) limit = 10;
    if (page < 1) page = 1;
    const offset = (page - 1) * limit;

    // Query calon peserta
    let where = [
      "u.status = 'active'",
      "r.name = 'murid'",
      "NOT EXISTS (SELECT 1 FROM peserta_ujian pu WHERE pu.ujian_id = ? AND pu.user_id = u.id)",
      "ub.is_current = 1",
      "b.order_level BETWEEN ? AND ?",
    ];
    let params = [ujianId, minOrder, maxOrder];

    if (search) {
      where.push("(u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = "WHERE " + where.join(" AND ");

    // Count total
    const countQuery = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM users u
      JOIN user_roles ur ON ur.user_id = u.id
      JOIN roles r ON r.id = ur.role_id
      JOIN user_belts ub ON ub.user_id = u.id AND ub.is_current = 1
      JOIN belts b ON ub.belt_id = b.id
      ${whereClause}
    `;
    const [[{ total }]] = await db.query(countQuery, params);
    const totalPages = Math.ceil(total / limit);

    // Data
    const dataQuery = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.tanggal_lahir,
        b.id AS belt_id,
        b.name AS belt_name,
        b.order_level AS belt_order
      FROM users u
      JOIN user_roles ur ON ur.user_id = u.id
      JOIN roles r ON r.id = ur.role_id
      JOIN user_belts ub ON ub.user_id = u.id AND ub.is_current = 1
      JOIN belts b ON ub.belt_id = b.id
      ${whereClause}
      ORDER BY u.name ASC
      LIMIT ? OFFSET ?
    `;
    const dataParams = [...params, limit, offset];
    const [rows] = await db.query(dataQuery, dataParams);

    const data = rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      tanggal_lahir: row.tanggal_lahir,
      belt_id: row.belt_id, // <--- tambahan: ID sabuk saat ini
      sabuk_saat_ini: row.belt_id
        ? { id: row.belt_id, nama: row.belt_name, order: row.belt_order }
        : null,
    }));

    return res.status(200).json({
      message: "Berhasil mengambil calon peserta ujian",
      pagination: {
        current_page: page,
        per_page: limit,
        total_page: totalPages,
        total_data: total,
        has_next: page < totalPages,
        has_prev: page > 1,
      },
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal mengambil calon peserta ujian",
      error: error.message,
    });
  }
};
