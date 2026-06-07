const db = require("../../../config/database");

exports.getLiburJadwal = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const jadwalId = parseInt(req.params.id);
    if (isNaN(jadwalId) || jadwalId < 1) {
      return res.status(400).json({ message: "ID jadwal tidak valid" });
    }

    const [rows] = await conn.query(
      "SELECT id, jadwal_id, tanggal, keterangan, created_at FROM libur_jadwal WHERE jadwal_id = ? ORDER BY tanggal ASC",
      [jadwalId],
    );

    return res.status(200).json({
      message: "Berhasil mengambil daftar hari libur",
      data: rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal mengambil hari libur",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
