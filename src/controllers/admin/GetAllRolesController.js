const db = require("../../config/database");

exports.getAllRoles = async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT id, name FROM roles ORDER BY name ASC",
    );

    res.json({
      message: "List roles",
      data: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Gagal mengambil data role",
    });
  }
};
