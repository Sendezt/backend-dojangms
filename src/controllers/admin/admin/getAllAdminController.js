const db = require("../../../config/database");

exports.getAllAdmin = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const allowedLimits = [10, 25, 50, 75, 100, 200];
    const allowedStatuses = ["active", "inactive"];

    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim() || null;
    const status = req.query.status?.trim() || null;

    if (!allowedLimits.includes(limit)) limit = 10;
    if (page < 1) page = 1;

    const offset = (page - 1) * limit;
    const filteredStatus = allowedStatuses.includes(status) ? status : null;

    // WHERE clause untuk admin
    const whereClauses = [
      "EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id AND r.name = 'admin')",
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

    // Summary total admin (tidak terpengaruh filter pencarian & status)
    const [[summary]] = await conn.query(`
      SELECT
        COUNT(DISTINCT u.id) AS total_admin,
        SUM(CASE WHEN u.status = 'active' THEN 1 ELSE 0 END) AS total_admin_active,
        SUM(CASE WHEN u.status = 'inactive' THEN 1 ELSE 0 END) AS total_admin_inactive
      FROM users u
      JOIN user_roles ur ON ur.user_id = u.id
      JOIN roles r ON r.id = ur.role_id
      WHERE r.name = 'admin'
    `);

    // Total data dengan filter
    const [[totalData]] = await conn.query(
      `SELECT COUNT(DISTINCT u.id) AS total FROM users u ${whereSQL}`,
      whereParams
    );
    const total = totalData.total;
    const totalPage = Math.max(Math.ceil(total / limit), 1);

    // Ambil data admin
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
        u.updated_at
      FROM users u
      ${whereSQL}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [...whereParams, limit, offset]
    );

    // Format data (tidak ada informasi tambahan untuk admin)
    const data = rows.map((admin) => ({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      foto: admin.foto,
      jenis_kelamin: admin.jenis_kelamin,
      alamat: admin.alamat,
      tanggal_lahir: admin.tanggal_lahir,
      status: admin.status,
      tanggal_bergabung: admin.created_at,
      updated_at: admin.updated_at,
    }));

    return res.status(200).json({
      message: data.length === 0 ? "Data admin masih kosong" : "Berhasil mengambil data admin",
      summary: {
        total_admin: summary.total_admin || 0,
        total_admin_active: String(summary.total_admin_active || 0),
        total_admin_inactive: String(summary.total_admin_inactive || 0),
      },
      pagination: {
        page,
        limit,
        total_data: total,
        total_page: totalPage,
        has_next: page < totalPage,
        has_prev: page > 1,
      },
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal mengambil data admin",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};