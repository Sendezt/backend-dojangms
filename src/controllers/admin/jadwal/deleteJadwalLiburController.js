const db = require("../../../config/database");

exports.deleteLiburJadwal = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const jadwalId = parseInt(req.params.id);
    const tanggal = req.params.tanggal;

    if (isNaN(jadwalId) || jadwalId < 1) {
      return res.status(400).json({ message: "ID jadwal tidak valid" });
    }
    if (!tanggal || isNaN(Date.parse(tanggal))) {
      return res.status(400).json({ message: "Format tanggal tidak valid" });
    }

    const [result] = await conn.query(
      "DELETE FROM libur_jadwal WHERE jadwal_id = ? AND tanggal = ?",
      [jadwalId, tanggal],
    );
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Hari libur tidak ditemukan untuk jadwal ini" });
    }

    return res.status(200).json({
      message: "Hari libur berhasil dihapus",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal menghapus hari libur",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
