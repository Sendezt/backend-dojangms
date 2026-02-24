const db = require("../../../config/database");

exports.getUpcomingKejuaraan3Months = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const nowWIB = `
      DATE(CONVERT_TZ(NOW(), '+00:00', '+07:00'))
    `;

    const [rows] = await conn.query(`
      SELECT 
        id,
        name,
        level,
        location,
        year,
        start_date,
        end_date
      FROM kejuaraan
      WHERE 
        start_date >= ${nowWIB}
        AND start_date <= DATE_ADD(${nowWIB}, INTERVAL 3 MONTH)
      ORDER BY start_date ASC
    `);

    if (rows.length === 0) {
      return res.status(200).json({
        message: "Tidak ada kejuaraan dalam 3 bulan ke depan",
        total: 0,
        data: [],
      });
    }

    // 🔥 Tambahkan info tambahan (optional tapi bagus untuk FE)
    const formattedData = rows.map((item) => {
      const today = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
      );

      const startDate = new Date(item.start_date);
      const diffTime = startDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        ...item,
        daysRemaining: diffDays, // sisa hari menuju event
      };
    });

    res.status(200).json({
      message: "Berhasil mengambil kejuaraan 3 bulan ke depan",
      total: formattedData.length,
      data: formattedData,
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil data kejuaraan",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
