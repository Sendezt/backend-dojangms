const db = require("../../../config/database");

exports.getKelasById = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const kelasId = parseInt(req.params.id);

    if (!kelasId || isNaN(kelasId) || kelasId < 1) {
      return res.status(400).json({ message: "ID kelas tidak valid" });
    }

    const [rows] = await conn.query(
      "SELECT id, nama, deskripsi, status FROM kelas WHERE id = ?",
      [kelasId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Kelas tidak ditemukan" });
    }

    return res.status(200).json({
      message: "Berhasil mengambil detail kelas",
      data: rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal mengambil detail kelas",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
