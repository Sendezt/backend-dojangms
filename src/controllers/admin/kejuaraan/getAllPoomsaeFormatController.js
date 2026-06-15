const db = require("../../../config/database");

exports.getAllPoomsaeFormat = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name FROM poomsae_format ORDER BY id ASC"
    );
    return res.status(200).json({
      success: true,
      message: rows.length ? "Berhasil mengambil data format poomsae" : "Tidak ada data format poomsae",
      data: rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data format poomsae",
      error: error.message,
    });
  }
};