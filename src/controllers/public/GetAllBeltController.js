const db = require("../../config/database");

exports.getAllBelts = async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM belts ORDER BY order_level ASC",
    );

    res.json({
      message: "List belts",
      data: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Gagal mengambil data belt",
    });
  }
};
