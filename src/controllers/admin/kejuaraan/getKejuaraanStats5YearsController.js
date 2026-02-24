const db = require("../../../config/database");

exports.getKejuaraanStats5Years = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const nowWIB = `
      DATE(CONVERT_TZ(NOW(), '+00:00', '+07:00'))
    `;

    // 🔥 Query statistik 5 tahun
    const [rows] = await conn.query(`
      SELECT 
        year,
        COUNT(*) AS totalKejuaraan,
        SUM(
          CASE 
            WHEN year = YEAR(${nowWIB})
            AND end_date < ${nowWIB}
            THEN 1 ELSE 0 
          END
        ) AS selesai,
        SUM(
          CASE 
            WHEN year = YEAR(${nowWIB})
            AND start_date <= ${nowWIB}
            AND end_date >= ${nowWIB}
            THEN 1 ELSE 0 
          END
        ) AS berlangsung,
        SUM(
          CASE 
            WHEN year = YEAR(${nowWIB})
            AND start_date > ${nowWIB}
            THEN 1 ELSE 0 
          END
        ) AS akanDatang
      FROM kejuaraan
      WHERE year >= YEAR(${nowWIB}) - 4
      GROUP BY year
      ORDER BY year ASC
    `);

    // 🔥 Ambil kejuaraan terakhir yang selesai tahun ini
    const [lastFinished] = await conn.query(`
      SELECT id, name, level, location, start_date, end_date
      FROM kejuaraan
      WHERE 
        year = YEAR(${nowWIB})
        AND end_date < ${nowWIB}
      ORDER BY end_date DESC
      LIMIT 1
    `);

    const currentYear = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
    ).getFullYear();

    const resultMap = {};
    rows.forEach((row) => {
      resultMap[row.year] = row;
    });

    const finalData = [];

    for (let i = 4; i >= 0; i--) {
      const year = currentYear - i;

      const data = resultMap[year] || {
        totalKejuaraan: 0,
        selesai: 0,
        berlangsung: 0,
        akanDatang: 0,
      };

      finalData.push({
        year,
        totalKejuaraan: data.totalKejuaraan,
        ...(year === currentYear && {
          rincian: {
            selesai: data.selesai || 0,
            berlangsung: data.berlangsung || 0,
            akanDatang: data.akanDatang || 0,
          },
          kejuaraanTerakhirSelesai:
            lastFinished.length > 0 ? lastFinished[0] : null,
        }),
      });
    }

    res.status(200).json({
      message: "Berhasil mengambil statistik kejuaraan 5 tahun terakhir",
      data: finalData,
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil statistik kejuaraan",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
