const db = require("../../../config/database");

exports.getAllKategoriUsia = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name FROM kategori_usia ORDER BY id ASC"
    );

    return res.status(200).json({
      success: true,
      message: rows.length ? "Berhasil mengambil data kategori usia" : "Tidak ada data kategori usia",
      data: rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data kategori usia",
      error: error.message,
    });
  }
};