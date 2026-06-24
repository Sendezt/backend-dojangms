// src/controllers/admin/kelas/getCalonMuridController.js
const db = require("../../../config/database");

const ALLOWED_LIMITS = [10, 25, 50, 75, 100, 200];

exports.getCalonMurid = async (req, res) => {
  try {
    const kelasId = parseInt(req.params.kelasId);
    if (isNaN(kelasId) || kelasId < 1) {
      return res.status(400).json({ message: "ID kelas tidak valid" });
    }

    // Cek apakah kelas ada
    const [kelas] = await db.query("SELECT id FROM kelas WHERE id = ?", [
      kelasId,
    ]);
    if (kelas.length === 0) {
      return res.status(404).json({ message: "Kelas tidak ditemukan" });
    }

    // Pagination
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim() || null;

    if (!ALLOWED_LIMITS.includes(limit)) limit = 10;
    if (page < 1) page = 1;
    const offset = (page - 1) * limit;

    // Filter search
    let searchCondition = "";
    let searchParams = [];
    if (search) {
      searchCondition =
        "AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)";
      searchParams = [`%${search}%`, `%${search}%`, `%${search}%`];
    }

    // Hitung total calon murid (role murid, status active, belum terdaftar di kelas ini)
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      JOIN user_roles ur ON ur.user_id = u.id
      JOIN roles r ON r.id = ur.role_id
      WHERE r.name = 'murid'
        AND u.status = 'active'
        AND NOT EXISTS (
          SELECT 1 FROM kelas_murid km
          WHERE km.user_id = u.id
            AND km.kelas_id = ?
            AND km.status = 'aktif'
        )
        ${searchCondition}
    `;
    const countParams = [kelasId, ...searchParams];
    const [[{ total }]] = await db.query(countQuery, countParams);
    const totalPages = Math.ceil(total / limit);

    // Ambil data calon murid
    const dataQuery = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.tanggal_lahir,
        u.status,
        b.id AS belt_id,
        b.name AS belt_name
      FROM users u
      JOIN user_roles ur ON ur.user_id = u.id
      JOIN roles r ON r.id = ur.role_id
      LEFT JOIN user_belts ub ON ub.user_id = u.id AND ub.is_current = 1
      LEFT JOIN belts b ON b.id = ub.belt_id
      WHERE r.name = 'murid'
        AND u.status = 'active'
        AND NOT EXISTS (
          SELECT 1 FROM kelas_murid km
          WHERE km.user_id = u.id
            AND km.kelas_id = ?
            AND km.status = 'aktif'
        )
        ${searchCondition}
      ORDER BY u.name ASC
      LIMIT ? OFFSET ?
    `;
    const dataParams = [kelasId, ...searchParams, limit, offset];
    const [rows] = await db.query(dataQuery, dataParams);

    const data = rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      tanggal_lahir: row.tanggal_lahir,
      status: row.status,
      sabuk_saat_ini: row.belt_id
        ? { id: row.belt_id, name: row.belt_name }
        : null,
    }));

    return res.status(200).json({
      message:
        data.length === 0
          ? "Tidak ada calon murid untuk kelas ini"
          : "Berhasil mengambil calon murid",
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
      message: "Gagal mengambil calon murid",
      error: error.message,
    });
  }
};
