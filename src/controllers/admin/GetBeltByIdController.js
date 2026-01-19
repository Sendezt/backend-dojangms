const db = require("../../config/database");

exports.getBeltById = async (req, res) => {
  try {
    const { id } = req.params;

    const [[belt]] = await db.execute("SELECT * FROM belts WHERE id = ?", [id]);

    if (!belt) {
      return res.status(404).json({
        message: "Belt tidak ditemukan",
      });
    }

    res.json({
      message: "Detail belt",
      data: belt,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Gagal mengambil data belt",
    });
  }
};
