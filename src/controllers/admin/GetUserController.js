const db = require("../../config/database");

exports.getUser = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const allowedLimits = [10, 25, 50, 75, 100, 200];
    const allowedRoles = ["murid", "admin", "pelatih"];

    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    let role = req.query.role || null;

    if (!allowedLimits.includes(limit)) limit = 10;
    if (page < 1) page = 1;

    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "Role tidak valid. Pilih: murid, admin, atau pelatih",
      });
    }

    const offset = (page - 1) * limit;

    // ============================================
    // 1. SUMMARY GLOBAL (1 QUERY)
    // ============================================
    const [[summary]] = await conn.query(`
      SELECT
        COUNT(DISTINCT u.id) AS total,
        SUM(CASE WHEN r.name = 'murid' AND u.status = 'active' THEN 1 ELSE 0 END) AS total_murid,
        SUM(CASE WHEN r.name = 'admin' AND u.status = 'active' THEN 1 ELSE 0 END) AS total_admin,
        SUM(CASE WHEN r.name = 'pelatih' AND u.status = 'active' THEN 1 ELSE 0 END) AS total_pelatih
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      WHERE u.status = 'active'
    `);

    // ============================================
    // 2. TOTAL DATA SESUAI FILTER
    // ============================================
    let totalCountParams = [];
    let totalDataQuery = `SELECT COUNT(*) AS total FROM users WHERE status = 'active'`;

    if (role) {
      totalDataQuery = `
        SELECT COUNT(DISTINCT u.id) AS total 
        FROM users u
        JOIN user_roles ur ON ur.user_id = u.id
        JOIN roles r ON r.id = ur.role_id
        WHERE r.name = ? AND u.status = 'active'
      `;
      totalCountParams = [role];
    }

    const [[totalData]] = await conn.query(totalDataQuery, totalCountParams);
    const totalPage = Math.ceil(totalData.total / limit);

    // ============================================
    // 3. AMBIL DATA DENGAN FILTER
    // ============================================
    let queryParams = [];
    let mainQuery = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.tanggal_lahir,
        u.status,
        u.created_at,
        roles.roles,
        belt.current_belt,
        belt.belt_achieved_at
      FROM users u
      LEFT JOIN (
        SELECT 
          ur.user_id,
          GROUP_CONCAT(r.name ORDER BY r.name SEPARATOR ', ') AS roles
        FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        GROUP BY ur.user_id
      ) roles ON roles.user_id = u.id
      LEFT JOIN (
        SELECT 
          ub.user_id,
          b.name AS current_belt,
          ub.achieved_at AS belt_achieved_at
        FROM user_belts ub
        JOIN belts b ON b.id = ub.belt_id
        WHERE ub.is_current = true
      ) belt ON belt.user_id = u.id
    `;

    if (role) {
      mainQuery += `
        WHERE u.id IN (
          SELECT DISTINCT ur.user_id 
          FROM user_roles ur 
          JOIN roles r ON r.id = ur.role_id 
          WHERE r.name = ?
        )
      `;
      queryParams.push(role);
    }

    mainQuery += ` ORDER BY u.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const [rows] = await conn.query(mainQuery, queryParams);

    // ============================================
    // 4. FORMAT DATA
    // ============================================
    const data = rows.map((user) => ({
      ...user,
      roles: user.roles ? user.roles.split(",").map((r) => r.trim()) : [],
    }));

    // ============================================
    // 5. RESPONSE
    // ============================================
    const responsePayload = {
      message:
        data.length === 0
          ? role
            ? `Data user dengan role ${role} masih kosong`
            : "Data user masih kosong"
          : "Berhasil mengambil data user",
      summary: {
        total: summary.total,
        total_murid: summary.total_murid,
        total_admin: summary.total_admin,
        total_pelatih: summary.total_pelatih,
      },
      pagination: {
        page,
        limit,
        total_data: totalData.total,
        total_page: totalPage,
        has_next: page < totalPage,
        has_prev: page > 1,
      },
      data,
    };

    return res.status(200).json(responsePayload);
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil data user",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
