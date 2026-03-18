const db = require("../../../config/database");

exports.getUser = async (req, res) => {
  const conn = await db.getConnection();

  try {
    // ===============================
    // QUERY PARAMS
    // ===============================
    const allowedLimits = [10, 25, 50, 75, 100, 200];
    const allowedRoles = ["murid", "admin", "pelatih"];
    const allowedStatus = ["active", "inactive"];

    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    let role = req.query.role || null;
    let status = req.query.status || "active";
    let search = req.query.search || null;

    if (!allowedLimits.includes(limit)) limit = 10;
    if (page < 1) page = 1;

    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "Role tidak valid",
      });
    }

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        message: "Status tidak valid",
      });
    }

    const offset = (page - 1) * limit;

    // ===============================
    // 1. SUMMARY (ANTI DOUBLE COUNT)
    // ===============================
    const [[summary]] = await conn.query(`
      SELECT
        COUNT(DISTINCT u.id) AS total,
        COUNT(DISTINCT CASE WHEN r.name = 'murid' THEN u.id END) AS total_murid,
        COUNT(DISTINCT CASE WHEN r.name = 'admin' THEN u.id END) AS total_admin,
        COUNT(DISTINCT CASE WHEN r.name = 'pelatih' THEN u.id END) AS total_pelatih
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
    `);

    // ===============================
    // 2. BASE QUERY
    // ===============================
    let whereClause = `WHERE u.status = ?`;
    let params = [status];

    // filter role
    if (role) {
      whereClause += `
        AND u.id IN (
          SELECT ur.user_id
          FROM user_roles ur
          JOIN roles r ON r.id = ur.role_id
          WHERE r.name = ?
        )
      `;
      params.push(role);
    }

    // search
    if (search) {
      whereClause += `
        AND (u.name LIKE ? OR u.email LIKE ?)
      `;
      params.push(`%${search}%`, `%${search}%`);
    }

    // ===============================
    // 3. TOTAL DATA
    // ===============================
    const [[totalData]] = await conn.query(
      `SELECT COUNT(DISTINCT u.id) AS total FROM users u ${whereClause}`,
      params,
    );

    const totalPage = Math.ceil(totalData.total / limit);

    // ===============================
    // 4. MAIN QUERY
    // ===============================
    const mainQuery = `
     SELECT 
  u.id,
  u.name,
  u.email,
  u.phone,
  u.tanggal_lahir,
  u.status,
  u.created_at,

  GROUP_CONCAT(DISTINCT r.name ORDER BY r.name) AS roles,

  MAX(b.name) AS current_belt,
  MAX(ub.achieved_at) AS belt_achieved_at

FROM users u

LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN roles r ON r.id = ur.role_id

LEFT JOIN user_belts ub 
  ON ub.user_id = u.id AND ub.is_current = true
LEFT JOIN belts b 
  ON b.id = ub.belt_id

-- pakai whereClause yang sudah Anda bangun di kode
 ${whereClause}

GROUP BY 
  u.id,
  u.name,
  u.email,
  u.phone,
  u.tanggal_lahir,
  u.status,
  u.created_at

ORDER BY u.created_at DESC
LIMIT ? OFFSET ?`;

    const [rows] = await conn.query(mainQuery, [...params, limit, offset]);

    // ===============================
    // 5. FORMAT DATA
    // ===============================
    const data = rows.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      tanggal_lahir: user.tanggal_lahir,
      status: user.status,
      created_at: user.created_at,
      roles: user.roles ? user.roles.split(",") : [],
      belt: user.current_belt
        ? {
            name: user.current_belt,
            achieved_at: user.belt_achieved_at,
          }
        : null,
    }));

    // ===============================
    // 6. RESPONSE
    // ===============================
    return res.status(200).json({
      message:
        data.length === 0
          ? "Data user tidak ditemukan"
          : "Berhasil mengambil data user",

      summary,

      pagination: {
        page,
        limit,
        total_data: totalData.total,
        total_page: totalPage,
        has_next: page < totalPage,
        has_prev: page > 1,
      },

      filters: {
        role,
        status,
        search,
      },

      data,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil data user",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
