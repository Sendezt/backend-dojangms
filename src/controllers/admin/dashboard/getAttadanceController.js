// src/controllers/admin/dashboardController.js (tambahkan di bawah getAdminDashboard)
const db = require("../../../config/database");

/**
 * GET /api/admin/dashboard/attendance-trend
 * Data absensi untuk grafik (daily, weekly, monthly)
 * Query params: period (daily/weekly/monthly), start_date, end_date
 */
exports.getAttendanceTrend = async (req, res) => {
  try {
    const period = req.query.period || "daily";
    const startDate = req.query.start_date || null;
    const endDate = req.query.end_date || null;

    let selectLabel = "";
    let groupBy = "";
    let defaultDays = 0;

    switch (period) {
      case "weekly":
        // Label format: 2026-W24
        selectLabel = `CONCAT(YEAR(tanggal), '-W', LPAD(WEEK(tanggal), 2, '0'))`;
        groupBy = selectLabel;
        defaultDays = 83; // 12 minggu
        break;
      case "monthly":
        selectLabel = `DATE_FORMAT(tanggal, '%Y-%m')`;
        groupBy = selectLabel;
        defaultDays = 365; // 12 bulan
        break;
      default: // daily
        selectLabel = `DATE_FORMAT(tanggal, '%Y-%m-%d')`;
        groupBy = "tanggal";
        defaultDays = 29; // 30 hari terakhir
    }

    // Tentukan rentang tanggal
    let whereConditions = [];
    let params = [];

    if (startDate) {
      whereConditions.push("tanggal >= ?");
      params.push(startDate);
    }
    if (endDate) {
      whereConditions.push("tanggal <= ?");
      params.push(endDate);
    }

    // Jika tidak ada filter, ambil N hari terakhir
    if (!startDate && !endDate) {
      const today = new Date();
      const limitDate = new Date(today);
      limitDate.setDate(today.getDate() - defaultDays);
      const limitStr = limitDate.toISOString().split("T")[0];
      whereConditions.push("tanggal >= ?");
      params.push(limitStr);
    }

    const whereClause = whereConditions.length
      ? "WHERE " + whereConditions.join(" AND ")
      : "";

    const query = `
      SELECT
        ${selectLabel} AS label,
        SUM(CASE WHEN status = 'hadir' THEN 1 ELSE 0 END) AS hadir,
        SUM(CASE WHEN status = 'izin' THEN 1 ELSE 0 END) AS izin,
        SUM(CASE WHEN status = 'sakit' THEN 1 ELSE 0 END) AS sakit,
        SUM(CASE WHEN status = 'alpha' THEN 1 ELSE 0 END) AS alpha,
        COUNT(*) AS total
      FROM absensi
      ${whereClause}
      GROUP BY ${groupBy}
      ORDER BY label ASC
    `;
    const [rows] = await db.query(query, params);

    const labels = rows.map((r) => r.label);
    const hadir = rows.map((r) => Number(r.hadir));
    const izin = rows.map((r) => Number(r.izin));
    const sakit = rows.map((r) => Number(r.sakit));
    const alpha = rows.map((r) => Number(r.alpha));
    const total = rows.map((r) => Number(r.total));

    return res.status(200).json({
      success: true,
      data: {
        period,
        labels,
        hadir,
        izin,
        sakit,
        alpha,
        total,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data absensi",
      error: error.message,
    });
  }
};
