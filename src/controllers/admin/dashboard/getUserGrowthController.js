const db = require("../../../config/database");

/**
 * GET /api/admin/dashboard/user-growth
 * Data pertumbuhan user per bulan (murid, pelatih, admin)
 * - Jika `year` diberikan: tampilkan 12 bulan di tahun tersebut (Jan–Des).
 * - Jika `start_date` & `end_date` diberikan: tampilkan rentang tersebut.
 * - Jika tidak ada filter: tampilkan 12 bulan terakhir (termasuk bulan ini).
 */
exports.getUserGrowth = async (req, res) => {
  try {
    const period = req.query.period || "monthly";
    let startDate = req.query.start_date || null;
    let endDate = req.query.end_date || null;
    const yearParam = req.query.year ? parseInt(req.query.year) : null;

    let start, end;

    if (yearParam && !isNaN(yearParam) && yearParam > 2000) {
      // Seluruh tahun yang diminta (12 bulan)
      start = new Date(yearParam, 0, 1);
      end = new Date(yearParam, 11, 31);
    } else if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
      if (end < start) {
        return res.status(400).json({
          success: false,
          message: "end_date harus lebih besar dari start_date",
        });
      }
    } else {
      // Default: 12 bulan terakhir (termasuk bulan ini)
      const today = new Date();
      end = new Date(today);
      start = new Date(today);
      start.setMonth(today.getMonth() - 11);
      start.setDate(1);
    }

    // Format tanggal untuk query
    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];

    let groupBy = "";
    let dateFormat = "";
    if (period === "yearly") {
      groupBy = "YEAR(u.created_at)";
      dateFormat = "YEAR(u.created_at)";
    } else {
      groupBy = "DATE_FORMAT(u.created_at, '%Y-%m')";
      dateFormat = "DATE_FORMAT(u.created_at, '%Y-%m')";
    }

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
      WHERE DATE(u.created_at) BETWEEN ? AND ?
      GROUP BY ${groupBy}
      ORDER BY label ASC
    `;
    const params = [startStr, endStr];
    const [rows] = await db.query(query, params);

    // Generate labels sesuai rentang
    const labels = [];
    const total = [];
    const murid = [];
    const pelatih = [];
    const admin = [];

    const current = new Date(start);
    const endDateObj = new Date(end);
    while (current <= endDateObj) {
      const label = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`;
      labels.push(label);
      const found = rows.find((r) => r.label === label);
      total.push(found ? Number(found.total_users) : 0);
      murid.push(found ? Number(found.murid) : 0);
      pelatih.push(found ? Number(found.pelatih) : 0);
      admin.push(found ? Number(found.admin) : 0);
      current.setMonth(current.getMonth() + 1);
    }

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
