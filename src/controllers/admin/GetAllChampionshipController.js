const db = require("../../config/database");

exports.getAllChampionships = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        id,
        name,
        level,
        location,
        start_date,
        end_date
      FROM championships
      ORDER BY start_date DESC
    `);

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
