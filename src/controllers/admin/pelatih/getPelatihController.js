// src/controllers/admin/pelatih/getAllPelatihWithSummary.js
const db = require("../../../config/database");

exports.getAllPelatih = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const allowedLimits = [10, 25, 50, 75, 100, 200];
    const allowedStatuses = ["active", "inactive"];

    // Query params
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim() || null;
    const status = req.query.status?.trim() || null;

    if (!allowedLimits.includes(limit)) limit = 10;
    if (page < 1) page = 1;

    const offset = (page - 1) * limit;
    const filteredStatus = allowedStatuses.includes(status) ? status : null;

    // =====================================================
    // WHERE CLAUSE UNTUK PELATIH
    // =====================================================
    const whereClauses = [
      "EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id AND r.name = 'pelatih')",
    ];
    const whereParams = [];

    if (filteredStatus) {
      whereClauses.push("u.status = ?");
      whereParams.push(filteredStatus);
    }

    if (search) {
      whereClauses.push("(u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)");
      const like = `%${search}%`;
      whereParams.push(like, like, like);
    }

    const whereSQL = "WHERE " + whereClauses.join(" AND ");

    // =====================================================
    // 1️⃣ SUMMARY TOTAL PELATIH (TIDAK TERPENGARUH FILTER)
    // =====================================================
    const [[summary]] = await conn.query(`
      SELECT
        COUNT(DISTINCT u.id) AS total_pelatih,
        SUM(CASE WHEN u.status = 'active' THEN 1 ELSE 0 END) AS total_pelatih_active,
        SUM(CASE WHEN u.status = 'inactive' THEN 1 ELSE 0 END) AS total_pelatih_inactive
      FROM users u
      JOIN user_roles ur ON ur.user_id = u.id
      JOIN roles r ON r.id = ur.role_id
      WHERE r.name = 'pelatih'
    `);

    // =====================================================
    // 2️⃣ SUMMARY BELT PELATIH (TIDAK TERPENGARUH FILTER)
    // =====================================================
    const [beltSummary] = await conn.query(`
      SELECT 
        b.name AS belt_name,
        COUNT(DISTINCT u.id) AS total
      FROM users u
      JOIN user_roles ur ON ur.user_id = u.id
      JOIN roles r ON r.id = ur.role_id
      JOIN user_belts ub ON ub.user_id = u.id AND ub.is_current = true
      JOIN belts b ON b.id = ub.belt_id
      WHERE r.name = 'pelatih'
      GROUP BY b.id
      ORDER BY b.order_level ASC
    `);

    const beltCounts = {};
    beltSummary.forEach((belt) => {
      beltCounts[belt.belt_name] = belt.total;
    });

    // =====================================================
    // 3️⃣ TOTAL DATA PAGINATION (TERPENGARUH FILTER)
    // =====================================================
    const [[totalData]] = await conn.query(
      `
      SELECT COUNT(DISTINCT u.id) AS total
      FROM users u
      ${whereSQL}
      `,
      whereParams,
    );

    const total = totalData.total;
    const totalPage = Math.max(Math.ceil(total / limit), 1);

    // =====================================================
    // 4️⃣ DATA PELATIH (TERPENGARUH FILTER)
    // =====================================================
    const [rows] = await conn.query(
      `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.foto,
        u.jenis_kelamin,
        u.alamat,
        u.tanggal_lahir,
        u.status,
        u.created_at,
        u.updated_at,
        p.spesialisasi,
        p.bio,
        b.id AS belt_id,
        b.name AS current_belt,
        ub.achieved_at AS belt_achieved_at
      FROM users u
      LEFT JOIN pelatih p ON p.user_id = u.id
      LEFT JOIN user_belts ub ON ub.user_id = u.id AND ub.is_current = true
      LEFT JOIN belts b ON b.id = ub.belt_id
      ${whereSQL}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [...whereParams, limit, offset],
    );

    // =====================================================
    // 5️⃣ FORMAT DATA (opsional, bisa langsung kirim rows)
    // =====================================================
    const data = rows.map((pelatih) => ({
      id: pelatih.id,
      name: pelatih.name,
      email: pelatih.email,
      phone: pelatih.phone,
      foto: pelatih.foto,
      jenis_kelamin: pelatih.jenis_kelamin,
      alamat: pelatih.alamat,
      tanggal_lahir: pelatih.tanggal_lahir,
      status: pelatih.status,
      tanggal_bergabung: pelatih.created_at,
      updated_at: pelatih.updated_at,
      pelatih: {
        spesialisasi: pelatih.spesialisasi,
        bio: pelatih.bio,
      },
      sabuk_saat_ini: pelatih.belt_id
        ? {
            id: pelatih.belt_id,
            name: pelatih.current_belt,
            achieved_at: pelatih.belt_achieved_at,
          }
        : null,
    }));

    // =====================================================
    // RESPONSE
    // =====================================================
    return res.status(200).json({
      message:
        data.length === 0
          ? "Data pelatih masih kosong"
          : "Berhasil mengambil data pelatih",
      summary: {
        total_pelatih: summary.total_pelatih || 0,
        total_pelatih_active: String(summary.total_pelatih_active || 0),
        total_pelatih_inactive: String(summary.total_pelatih_inactive || 0),
        total_per_belt: beltCounts,
      },
      pagination: {
        page,
        limit,
        total_data: total,
        total_page: totalPage,
        has_next: page < totalPage,
        has_prev: page > 1,
      },
      data: data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal mengambil data pelatih",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
