const db = require("../../../config/database");

exports.getAllLevelKelas = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name FROM level_kelas ORDER BY id ASC"
    );

    return res.status(200).json({
      success: true,
      message: rows.length ? "Berhasil mengambil data level kelas" : "Tidak ada data level kelas",
      data: rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data level kelas",
      error: error.message,
    });
  }
};