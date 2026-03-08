const db = require("../../../config/database");

exports.getUserMuridOnly = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const allowedLimits = [10, 25, 50, 75, 100, 200];

    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;

    if (!allowedLimits.includes(limit)) limit = 10;
    if (page < 1) page = 1;

    const offset = (page - 1) * limit;

    // =====================================================
    // 1️⃣ SUMMARY TOTAL MURID (ACTIVE & INACTIVE)
    // =====================================================
    const [[summary]] = await conn.query(`
      SELECT
        COUNT(DISTINCT u.id) AS total_murid,
        SUM(CASE WHEN u.status = 'active' THEN 1 ELSE 0 END) AS total_murid_active,
        SUM(CASE WHEN u.status = 'inactive' THEN 1 ELSE 0 END) AS total_murid_inactive
      FROM users u
      JOIN user_roles ur ON ur.user_id = u.id
      JOIN roles r ON r.id = ur.role_id
      WHERE r.name = 'murid'
    `);

    // =====================================================
    // 2️⃣ SUMMARY BERDASARKAN BELT (CURRENT BELT SAJA)
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
      WHERE r.name = 'murid'
      GROUP BY b.id
      ORDER BY b.order_level ASC
    `);

    // format belt summary jadi object
    const beltCounts = {};
    beltSummary.forEach((belt) => {
      beltCounts[belt.belt_name] = belt.total;
    });

    // =====================================================
    // 3️⃣ TOTAL DATA UNTUK PAGINATION (ACTIVE SAJA)
    // =====================================================
    const [[totalData]] = await conn.query(`
      SELECT COUNT(DISTINCT u.id) AS total
      FROM users u
      JOIN user_roles ur ON ur.user_id = u.id
      JOIN roles r ON r.id = ur.role_id
      WHERE r.name = 'murid'
      AND u.status = 'active'
    `);

    const totalPage = Math.ceil(totalData.total / limit);

    // =====================================================
    // 4️⃣ AMBIL DATA MURID + CURRENT BELT
    // =====================================================
    const [rows] = await conn.query(
      `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.tanggal_lahir,
        u.status,
        u.created_at,
        b.name AS current_belt,
        ub.achieved_at AS belt_achieved_at
      FROM users u
      JOIN user_roles ur ON ur.user_id = u.id
      JOIN roles r ON r.id = ur.role_id
      LEFT JOIN user_belts ub 
        ON ub.user_id = u.id AND ub.is_current = true
      LEFT JOIN belts b 
        ON b.id = ub.belt_id
      WHERE r.name = 'murid'
      AND u.status = 'active'
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [limit, offset],
    );

    // =====================================================
    // 5️⃣ RESPONSE
    // =====================================================
    return res.status(200).json({
      message:
        rows.length === 0
          ? "Data murid masih kosong"
          : "Berhasil mengambil data user",
      summary: {
        total_murid: summary.total_murid,
        total_murid_active: summary.total_murid_active,
        total_murid_inactive: summary.total_murid_inactive,
        total_per_belt: beltCounts,
      },
      pagination: {
        page,
        limit,
        total_data: totalData.total,
        total_page: totalPage,
        has_next: page < totalPage,
        has_prev: page > 1,
      },
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil data murid",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
