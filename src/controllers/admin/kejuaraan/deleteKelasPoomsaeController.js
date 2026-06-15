const db = require("../../../config/database");

exports.deleteKelasPoomsae = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id < 1) {
      return res.status(400).json({ message: "ID tidak valid" });
    }

    // Cek apakah kelas poomsae ada
    const [existing] = await conn.query(
      "SELECT id FROM kelas_poomsae WHERE id = ?",
      [id],
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: "Kelas poomsae tidak ditemukan" });
    }

    // Cek apakah sudah digunakan di kelas_kejuaraan
    const [used] = await conn.query(
      "SELECT id FROM kelas_kejuaraan WHERE tipe = 'poomsae' AND kelas_id = ? LIMIT 1",
      [id],
    );
    if (used.length > 0) {
      return res.status(409).json({
        message:
          "Kelas poomsae sedang digunakan di kejuaraan, tidak dapat dihapus",
      });
    }

    await conn.query("DELETE FROM kelas_poomsae WHERE id = ?", [id]);

    res.status(200).json({ message: "Kelas poomsae berhasil dihapus" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Gagal menghapus kelas poomsae", error: error.message });
  } finally {
    conn.release();
  }
};
