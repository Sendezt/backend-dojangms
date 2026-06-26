const db = require("../../../config/database");

/**
 * GET /api/admin/dashboard/user-growth
 * Data pertumbuhan user per bulan (murid, pelatih, admin)
 * Query: period (monthly/yearly), start_date, end_date
 */
exports.getUserGrowth = async (req, res) => {
  try {
    const period = req.query.period || "monthly";
    const startDate = req.query.start_date || null;
    const endDate = req.query.end_date || null;

    let groupBy = "";
    let dateFormat = "";

    if (period === "yearly") {
      groupBy = "YEAR(u.created_at)";
      dateFormat = "YEAR(u.created_at)";
    } else {
      // monthly
      groupBy = "DATE_FORMAT(u.created_at, '%Y-%m')";
      dateFormat = "DATE_FORMAT(u.created_at, '%Y-%m')";
    }

    let whereConditions = [];
    let params = [];

    if (startDate) {
      whereConditions.push("DATE(u.created_at) >= ?");
      params.push(startDate);
    }
    if (endDate) {
      whereConditions.push("DATE(u.created_at) <= ?");
      params.push(endDate);
    }

    // Default: 12 bulan terakhir
    if (!startDate && !endDate) {
      const today = new Date();
      const limitDate = new Date(today);
      limitDate.setMonth(today.getMonth() - 11);
      const limitStr = limitDate.toISOString().split("T")[0];
      whereConditions.push("DATE(u.created_at) >= ?");
      params.push(limitStr);
    }

    const whereClause = whereConditions.length
      ? "WHERE " + whereConditions.join(" AND ")
      : "";

    const query = `
      SELECT
        ${dateFormat} AS label,
        COUNT(DISTINCT u.id) AS total_users,
        SUM(CASE WHEN r.name = 'murid' THEN 1 ELSE 0 END) AS murid,
        SUM(CASE WHEN r.name = 'pelatih' THEN 1 ELSE 0 END) AS pelatih,
        SUM(CASE WHEN r.name = 'admin' THEN 1 ELSE 0 END) AS admin
      FROM users u
      JOIN user_roles ur ON ur.user_id = u.id
      JOIN roles r ON r.id = ur.role_id
      ${whereClause}
      GROUP BY ${groupBy}
      ORDER BY label ASC
    `;
    const [rows] = await db.query(query, params);

    const labels = rows.map((r) => r.label);
    const total = rows.map((r) => Number(r.total_users));
    const murid = rows.map((r) => Number(r.murid));
    const pelatih = rows.map((r) => Number(r.pelatih));
    const admin = rows.map((r) => Number(r.admin));

    return res.status(200).json({
      success: true,
      data: {
        period,
        labels,
        total,
        murid,
        pelatih,
        admin,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data pertumbuhan user",
      error: error.message,
    });
  }
};
