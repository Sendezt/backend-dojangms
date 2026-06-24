const db = require("../../config/database");

const getJakartaNow = () => {
  return new Date(
    new Date().toLocaleDateString("en-US", { timeZone: "Asia/Jakarta" }),
  );
};

exports.getChampionshipById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "ID kejuaraan wajib diisi",
      });
    }

    const today = getJakartaNow();

    const [rows] = await db.execute(
      `
  SELECT 
    id,
    name,
    level,
    location,
    DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
    DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date,
    CASE
      WHEN start_date > ? THEN 'akan datang'
      WHEN start_date <= ? AND end_date >= ? THEN 'berlangsung'
      ELSE 'selesai'
    END AS status
  FROM kejuaraan
  WHERE id = ?
`,
      [today, today, today, id],
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
