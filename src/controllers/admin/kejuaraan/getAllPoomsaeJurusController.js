const db = require("../../../config/database");

exports.getAllPoomsaeJurus = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name FROM poomsae_jurus ORDER BY id ASC",
    );
    return res.status(200).json({
      success: true,
      message: rows.length
        ? "Berhasil mengambil data jurus poomsae"
        : "Tidak ada data jurus poomsae",
      data: rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data jurus poomsae",
      error: error.message,
    });
  }
};
