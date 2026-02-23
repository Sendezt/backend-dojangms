const getJakartaNow = () => {
  return new Date(
    new Date().toLocaleDateString("en-US", { timeZone: "Asia/Jakarta" }),
  );
};
const db = require("../../config/database");

exports.getAllChampionships = async (req, res) => {
  try {
    const today = getJakartaNow();
    const [rows] = await db.execute(
      `
      SELECT 
        id,
        name,
        level,
        location,
        start_date,
        end_date,
        CASE
          WHEN start_date > ? THEN 'akan datang'
          WHEN start_date <= ? AND end_date >= ? THEN 'berlangsung'
          ELSE 'selesai'
        END AS status
      FROM kejuaraan
      ORDER BY start_date DESC
    `,
      [today, today, today],
    );

    if (rows.length === 0) {
      return res.status(200).json({
        message: "Data kejuaraan masih kosong",
        data: [],
      });
    }

    res.status(200).json({
      message: "Berhasil mengambil data championship",
      total: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Terjadi kesalahan pada server",
    });
  }
};
