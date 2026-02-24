const db = require("../../config/database");

exports.getMonthlyMuridStats = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const [rows] = await conn.query(`
      SELECT 
        DATE_FORMAT(CONVERT_TZ(u.created_at, '+00:00', '+07:00'), '%Y-%m') AS month,
        COUNT(*) AS totalMuridBaru
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON r.id = ur.role_id
      WHERE 
        r.name = 'murid'
        AND u.status = 'active'
        AND CONVERT_TZ(u.created_at, '+00:00', '+07:00') >= DATE_SUB(CURDATE(), INTERVAL 2 MONTH)
      GROUP BY month
      ORDER BY month ASC
    `);

    // 🔥 Gunakan timezone Asia/Jakarta
    const now = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
    );

    const currentMonth = now.toISOString().slice(0, 7);

    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = lastMonthDate.toISOString().slice(0, 7);

    // 🔥 Label berdasarkan Asia/Jakarta
    const labelBulan = now.toLocaleDateString("id-ID", {
      month: "long",
      timeZone: "Asia/Jakarta",
    });

    const labelTahun = now.getFullYear().toString();

    let bulanIni = 0;
    let bulanLalu = 0;

    rows.forEach((row) => {
      if (row.month === currentMonth) {
        bulanIni = row.totalMuridBaru;
      }
      if (row.month === lastMonth) {
        bulanLalu = row.totalMuridBaru;
      }
    });

    const change = bulanIni - bulanLalu;

    const percentChange =
      bulanLalu === 0
        ? bulanIni > 0
          ? 100
          : 0
        : Number(((change / bulanLalu) * 100).toFixed(2));

    const trend = change > 0 ? "up" : change < 0 ? "down" : "stable";

    res.status(200).json({
      message: "Berhasil mengambil statistik murid bulanan",
      data: {
        bulan: currentMonth,
        labelBulan,
        labelTahun,
        bulanIni,
        bulanLalu,
        change,
        percentChange,
        trend,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil statistik murid",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
