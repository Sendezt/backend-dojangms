const db = require("../../config/database");

exports.getUser = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const allowedLimits = [10, 25, 50, 75, 100, 200];
    const allowedRoles = ["murid", "admin", "pelatih"]; // Roles yang diizinkan

    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    let role = req.query.role || null; // Ambil parameter role

    if (!allowedLimits.includes(limit)) limit = 10;
    if (page < 1) page = 1;

    // Validasi role jika disediakan
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "Role tidak valid. Pilih: murid, admin, atau pelatih",
      });
    }

    const offset = (page - 1) * limit;

    // ============================================
    // 1. AMBIL GLOBAL COUNTS (SELALU DIPERLUKAN)
    // ============================================
    const [[muridActiveGlobal]] = await conn.query(`
      SELECT COUNT(DISTINCT u.id) AS total
      FROM users u
      JOIN user_roles ur On ur.user_id = u.id
      JOIN roles r ON r.id = ur.role_id
      WHERE r.name = 'murid' AND u.status = 'active'
    `);

    const [[adminActiveGlobal]] = await conn.query(`
      SELECT COUNT(DISTINCT u.id) AS total
      FROM users u
      JOIN user_roles ur On ur.user_id = u.id
      JOIN roles r ON r.id = ur.role_id
      WHERE r.name = 'admin' AND u.status = 'active'
    `);

    const [[pelatihActiveGlobal]] = await conn.query(`
      SELECT COUNT(DISTINCT u.id) AS total
      FROM users u
      JOIN user_roles ur On ur.user_id = u.id
      JOIN roles r ON r.id = ur.role_id
      WHERE r.name = 'pelatih' AND u.status = 'active'
    `);

    const [[totalAllUsersGlobal]] = await conn.query(`
      SELECT COUNT(*) AS total FROM users WHERE status = 'active'
    `);

    // ============================================
    // 2. AMBIL DATA DENGAN FILTER (JIKA ADA)
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

    // Tambahkan filter role jika ada
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

    mainQuery += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);

    const [rows] = await conn.query(mainQuery, queryParams);

    // ============================================
    // 3. HITUNG TOTAL DATA SESUAI FILTER
    // ============================================
    let totalDataQuery = `SELECT COUNT(*) AS total FROM users WHERE status = 'active'`;
    let totalCountParams = [];

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

    // ============================================
    // 4. FORMAT DATA
    // ============================================
    const data = rows.map((user) => ({
      ...user,
      roles: user.roles ? user.roles.split(",").map((r) => r.trim()) : [],
    }));

    // Kondisi data kosong
    if (data.length === 0) {
      return res.json({
        message: role
          ? `Data user dengan role ${role} masih kosong`
          : "Data user masih kosong",
        meta: {
          page,
          limit,
          total_data: totalData.total,
          total_page: Math.ceil(totalData.total / limit),
          has_next: page * limit < totalData.total,
          has_prev: page > 1,
        },
        total: 0,
        totalMurid: muridActiveGlobal.total, // ✅ GLOBAL COUNT
        totalAdmin: adminActiveGlobal.total, // ✅ GLOBAL COUNT
        totalPelatih: pelatihActiveGlobal.total, // ✅ GLOBAL COUNT
        totalAllUsers: totalAllUsersGlobal.total, // ✅ GLOBAL COUNT
        data: [],
      });
    }

    // ============================================
    // 5. RESPONSE DENGAN GLOBAL COUNTS
    // ============================================
    res.status(200).json({
      message: "Berhasil mengambil data user",
      meta: {
        page,
        limit,
        total_data: totalData.total, // ✅ Total hasil FILTER
        total_page: Math.ceil(totalData.total / limit),
        has_next: page * limit < totalData.total,
        has_prev: page > 1,
      },
      total: data.length,
      totalMurid: muridActiveGlobal.total, // ✅ GLOBAL COUNT (selalu ditampilkan)
      totalAdmin: adminActiveGlobal.total, // ✅ GLOBAL COUNT (selalu ditampilkan)
      totalPelatih: pelatihActiveGlobal.total, // ✅ GLOBAL COUNT (selalu ditampilkan)
      totalAllUsers: totalAllUsersGlobal.total, // ✅ GLOBAL COUNT (selalu ditampilkan)
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil data user",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
