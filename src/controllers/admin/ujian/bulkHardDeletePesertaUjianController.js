// src/controllers/admin/ujianSabuk/bulkHardDeletePesertaUjianController.js
const db = require("../../../config/database");

exports.bulkHardDeletePesertaUjian = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const ujianId = parseInt(req.params.ujianId);
    let { user_ids } = req.body;

    if (isNaN(ujianId) || ujianId < 1) {
      return res.status(400).json({ message: "ID ujian tidak valid" });
    }
    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return res
        .status(400)
        .json({ message: "user_ids harus array tidak kosong" });
    }

    // Normalisasi user_ids menjadi integer
    user_ids = user_ids
      .filter((id) => !isNaN(parseInt(id)))
      .map((id) => parseInt(id));
    if (user_ids.length === 0) {
      return res.status(400).json({ message: "user_ids tidak valid" });
    }

    // Cek apakah ujian ada dan belum dihapus
    const [ujian] = await conn.query(
      "SELECT id FROM ujian_sabuk WHERE id = ? AND deleted_at IS NULL",
      [ujianId],
    );
    if (ujian.length === 0) {
      return res
        .status(404)
        .json({ message: "Ujian tidak ditemukan atau sudah dihapus" });
    }

    // Ambil peserta yang akan dihapus (untuk response)
    const placeholders = user_ids.map(() => "?").join(",");
    const [pesertaRows] = await conn.query(
      `SELECT pu.id, pu.user_id, u.name 
       FROM peserta_ujian pu
       JOIN users u ON pu.user_id = u.id
       WHERE pu.ujian_id = ? AND pu.user_id IN (${placeholders})`,
      [ujianId, ...user_ids],
    );

    const foundUserIds = pesertaRows.map((p) => p.user_id);
    const notFound = user_ids.filter((id) => !foundUserIds.includes(id));
    const idsToDelete = pesertaRows.map((p) => p.id);

    if (idsToDelete.length === 0) {
      return res.status(404).json({
        message: "Tidak ada peserta yang ditemukan untuk dihapus",
        not_found: notFound,
      });
    }

    // Hard delete
    const deletePlaceholders = idsToDelete.map(() => "?").join(",");
    const [result] = await conn.query(
      `DELETE FROM peserta_ujian WHERE id IN (${deletePlaceholders})`,
      idsToDelete,
    );

    return res.status(200).json({
      message: "Bulk hard delete peserta selesai",
      deleted_count: result.affectedRows,
      not_found: notFound,
      deleted: pesertaRows.map((p) => ({ user_id: p.user_id, name: p.name })),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal menghapus peserta secara bulk",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
