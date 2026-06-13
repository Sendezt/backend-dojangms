// src/controllers/admin/ujianSabuk/softDeleteUjianSabukController.js
const db = require("../../../config/database");

exports.softDeleteUjianSabuk = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id < 1) {
      return res.status(400).json({ message: "ID ujian tidak valid" });
    }

    // Cek apakah ujian ada dan belum dihapus
    const [existing] = await conn.query(
      "SELECT id FROM ujian_sabuk WHERE id = ? AND deleted_at IS NULL",
      [id],
    );
    if (existing.length === 0) {
      return res
        .status(404)
        .json({ message: "Ujian tidak ditemukan atau sudah dihapus" });
    }

    // Opsional: cek apakah ujian sudah memiliki peserta
    const [peserta] = await conn.query(
      "SELECT id FROM peserta_ujian WHERE ujian_id = ? LIMIT 1",
      [id],
    );
    if (peserta.length > 0) {
      return res
        .status(409)
        .json({
          message: "Tidak dapat menghapus ujian yang sudah memiliki peserta",
        });
    }

    // Soft delete
    await conn.query("UPDATE ujian_sabuk SET deleted_at = NOW() WHERE id = ?", [
      id,
    ]);

    res
      .status(200)
      .json({ message: "Ujian sabuk berhasil dihapus (soft delete)" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Gagal menghapus ujian", error: error.message });
  } finally {
    conn.release();
  }
};
