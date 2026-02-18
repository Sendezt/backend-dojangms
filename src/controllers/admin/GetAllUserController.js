const db = require("../../config/database");

exports.getAllUsers = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const allowedLimits = [10, 25, 50, 75, 100, 200];

    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;

    if (!allowedLimits.includes(limit)) limit = 10;
    if (page < 1) page = 1;

    const offset = (page - 1) * limit;

    const [rows] = await conn.query(`
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
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    // Untuk meta pagination
    const [[totalData]] = await conn.query(`
      SELECT COUNT(*) AS total FROM users
    `)

    const data = rows.map((user) => ({
      ...user,
      roles: user.roles ? user.roles.split(",") : [],
    }));

    const [[muridActive]] = await conn.query(`
      SELECT COUNT(DISTINCT u.id) AS total
      FROM users u
      JOIN user_roles ur On ur.user_id = u.id
      JOIN roles r ON r.id = ur.role_id
      WHERE r.name = 'murid' AND u.status = 'active'
      `);

    // Kondisi data kosong
    if (data.length === 0) {
      return res.json({
        message: "Data user masih kosong",
        data: [],
        totalMurid: muridActive.total,
      });
    }

    res.status(200).json({
      message: "Berhasil mengambil data user",
      meta: {
        page,
        limit,
        total_data: totalData.total,
        total_page: Math.ceil(totalData.total / limit),
        has_next: page * limit < totalData.total,
        has_prev: page > 1
      },
      total: data.length,
      totalMurid: muridActive.total,
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
