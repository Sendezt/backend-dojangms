const db = require("../../../config/database");

exports.deleteLiburGlobal = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id < 1) {
      return res.status(400).json({ message: "ID libur global tidak valid" });
    }

    const [result] = await conn.query("DELETE FROM libur_global WHERE id = ?", [
      id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Libur global tidak ditemukan" });
    }

    return res.status(200).json({
      message: "Libur global berhasil dihapus",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal menghapus libur global",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
