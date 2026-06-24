const db = require("../../../config/database");

const ALLOWED_LIMITS = [10, 25, 50, 75, 100, 200];

exports.getPelatihByKelas = async (req, res) => {
  try {
    const kelasId = parseInt(req.params.kelasId);
    if (isNaN(kelasId) || kelasId < 1) {
      return res.status(400).json({ message: "ID kelas tidak valid" });
    }

    const [kelas] = await db.query("SELECT id FROM kelas WHERE id = ?", [
      kelasId,
    ]);
    if (kelas.length === 0) {
      return res.status(404).json({ message: "Kelas tidak ditemukan" });
    }

    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim() || null;

    if (!ALLOWED_LIMITS.includes(limit)) limit = 10;
    if (page < 1) page = 1;
    const offset = (page - 1) * limit;

    let searchCondition = "";
    let searchParams = [];
    if (search) {
      searchCondition =
        "AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)";
      searchParams = [`%${search}%`, `%${search}%`, `%${search}%`];
    }

    const countQuery = `
      SELECT COUNT(*) as total
      FROM kelas_pelatih kp
      JOIN users u ON kp.user_id = u.id
      JOIN user_roles ur ON ur.user_id = u.id
      JOIN roles r ON r.id = ur.role_id
      WHERE kp.kelas_id = ?
        AND kp.status = 'aktif'
        AND r.name = 'pelatih'
        AND u.status = 'active'
        ${searchCondition}
    `;
    const countParams = [kelasId, ...searchParams];
    const [[{ total }]] = await db.query(countQuery, countParams);
    const totalPages = Math.ceil(total / limit);

    const dataQuery = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.tanggal_lahir,
        u.status,
        kp.tanggal_bergabung,
        p.spesialisasi,
        b.id AS belt_id,
        b.name AS belt_name
      FROM kelas_pelatih kp
      JOIN users u ON kp.user_id = u.id
      JOIN user_roles ur ON ur.user_id = u.id
      JOIN roles r ON r.id = ur.role_id
      LEFT JOIN pelatih p ON p.user_id = u.id
      LEFT JOIN user_belts ub ON ub.user_id = u.id AND ub.is_current = 1
      LEFT JOIN belts b ON b.id = ub.belt_id
      WHERE kp.kelas_id = ?
        AND kp.status = 'aktif'
        AND r.name = 'pelatih'
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
      status_user: row.status,
      tanggal_bergabung: row.tanggal_bergabung,
      spesialisasi: row.spesialisasi,
      sabuk_saat_ini: row.belt_id
        ? { id: row.belt_id, name: row.belt_name }
        : null,
    }));

    return res.status(200).json({
      message:
        data.length === 0
          ? "Belum ada pelatih di kelas ini"
          : "Berhasil mengambil daftar pelatih",
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
      message: "Gagal mengambil daftar pelatih",
      error: error.message,
    });
  }
};
