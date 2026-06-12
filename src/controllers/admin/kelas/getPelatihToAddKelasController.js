const db = require("../../../config/database");

const ALLOWED_LIMITS = [10, 25, 50, 75, 100, 200];

exports.getCalonPelatih = async (req, res) => {
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

    // Total calon pelatih
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      JOIN user_roles ur ON ur.user_id = u.id
      JOIN roles r ON r.id = ur.role_id
      WHERE r.name = 'pelatih'
        AND u.status = 'active'
        AND NOT EXISTS (
          SELECT 1 FROM kelas_pelatih kp
          WHERE kp.user_id = u.id
            AND kp.kelas_id = ?
            AND kp.status = 'aktif'
        )
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
        p.spesialisasi,
        b.id AS belt_id,
        b.name AS belt_name
      FROM users u
      JOIN user_roles ur ON ur.user_id = u.id
      JOIN roles r ON r.id = ur.role_id
      LEFT JOIN pelatih p ON p.user_id = u.id
      LEFT JOIN user_belts ub ON ub.user_id = u.id AND ub.is_current = 1
      LEFT JOIN belts b ON b.id = ub.belt_id
      WHERE r.name = 'pelatih'
        AND u.status = 'active'
        AND NOT EXISTS (
          SELECT 1 FROM kelas_pelatih kp
          WHERE kp.user_id = u.id
            AND kp.kelas_id = ?
            AND kp.status = 'aktif'
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
      spesialisasi: row.spesialisasi,
      sabuk_saat_ini: row.belt_id
        ? { id: row.belt_id, name: row.belt_name }
        : null,
    }));

    return res.status(200).json({
      message:
        data.length === 0
          ? "Tidak ada calon pelatih untuk kelas ini"
          : "Berhasil mengambil calon pelatih",
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
      message: "Gagal mengambil calon pelatih",
      error: error.message,
    });
  }
};
