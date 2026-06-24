// src/controllers/admin/ujianSabuk/restoreUjianSabukController.js
const db = require("../../../config/database");

exports.restoreUjianSabuk = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id < 1) {
      return res.status(400).json({ message: "ID ujian tidak valid" });
    }

    const [existing] = await conn.query(
      "SELECT id FROM ujian_sabuk WHERE id = ? AND deleted_at IS NOT NULL",
      [id],
    );
    if (existing.length === 0) {
      return res
        .status(404)
        .json({ message: "Ujian tidak ditemukan atau belum dihapus" });
    }

    await conn.query("UPDATE ujian_sabuk SET deleted_at = NULL WHERE id = ?", [
      id,
    ]);
    res.status(200).json({ message: "Ujian sabuk berhasil dipulihkan" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Gagal memulihkan ujian", error: error.message });
  } finally {
    conn.release();
  }
};
