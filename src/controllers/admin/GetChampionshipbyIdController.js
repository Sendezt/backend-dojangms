const db = require("../../config/database");

exports.getChampionshipById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "ID kejuaraan wajib diisi",
      });
    }

    const [rows] = await db.execute(
      `
      SELECT 
        id,
        name,
        level,
        location,
        start_date,
        end_date
      FROM kejuaraan
      WHERE id = ?
    `,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Championship tidak ditemukan",
      });
    }

    res.status(200).json({
      message: "Berhasil mengambil detail championship",
      data: rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Terjadi kesalahan pada server",
    });
  }
};
