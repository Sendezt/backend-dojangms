// src/controllers/pelatih/getMuridKelasSayaController.js
const db = require("../../../config/database");
const ALLOWED_LIMITS = [10, 25, 50, 75, 100, 200];

exports.getMuridKelasPelatih = async (req, res) => {
  try {
    const pelatihId = req.user.id;
    const kelasId = parseInt(req.params.kelasId);
    if (isNaN(kelasId) || kelasId < 1) {
      return res.status(400).json({
        success: false,
        message: "ID kelas tidak valid",
      });
    }

    // Cek apakah pelatih mengampu kelas ini
    const [kelasPelatih] = await db.query(
      "SELECT id FROM kelas_pelatih WHERE kelas_id = ? AND user_id = ? AND status = 'aktif'",
      [kelasId, pelatihId],
    );
    if (kelasPelatih.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki akses ke kelas ini",
      });
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

    // Hitung total murid aktif di kelas ini
    const countQuery = `
      SELECT COUNT(*) as total
      FROM kelas_murid km
      JOIN users u ON km.user_id = u.id
      WHERE km.kelas_id = ?
        AND km.status = 'aktif'
        AND u.status = 'active'
        ${searchCondition}
    `;
    const countParams = [kelasId, ...searchParams];
    const [[{ total }]] = await db.query(countQuery, countParams);
    const totalPages = Math.ceil(total / limit);

    // Ambil data murid
    const dataQuery = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.tanggal_lahir,
        u.status AS user_status,
        km.tanggal_bergabung,
        b.id AS belt_id,
        b.name AS belt_name
      FROM kelas_murid km
      JOIN users u ON km.user_id = u.id
      LEFT JOIN user_belts ub ON ub.user_id = u.id AND ub.is_current = 1
      LEFT JOIN belts b ON b.id = ub.belt_id
      WHERE km.kelas_id = ?
        AND km.status = 'aktif'
        AND u.status = 'active'
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
      status: row.user_status,
      tanggal_bergabung: row.tanggal_bergabung,
      sabuk_saat_ini: row.belt_id
        ? { id: row.belt_id, name: row.belt_name }
        : null,
    }));

    return res.status(200).json({
      success: true,
      message:
        data.length === 0
          ? "Belum ada murid di kelas ini"
          : "Berhasil mengambil daftar murid",
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
      message: "Gagal mengambil data murid",
      error: error.message,
    });
  }
};
