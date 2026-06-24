// src/controllers/admin/kejuaraan/bulkDeletePesertaKejuaraanController.js
const db = require("../../../config/database");

exports.bulkDeletePesertaKejuaraan = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { kelasKejuaraanId } = req.params;
    const { user_ids } = req.body;

    if (!kelasKejuaraanId || isNaN(kelasKejuaraanId)) {
      return res
        .status(400)
        .json({ message: "ID kelas kejuaraan tidak valid" });
    }
    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return res
        .status(400)
        .json({ message: "user_ids harus berupa array tidak kosong" });
    }

    const cleanUserIds = user_ids
      .map((id) => parseInt(id))
      .filter((id) => !isNaN(id) && id > 0);
    if (cleanUserIds.length === 0) {
      return res.status(400).json({ message: "Tidak ada user_id yang valid" });
    }

    // Cek apakah kelas kejuaraan ada
    const [kelas] = await conn.query(
      "SELECT id FROM kelas_kejuaraan WHERE id = ?",
      [kelasKejuaraanId],
    );
    if (kelas.length === 0) {
      return res
        .status(404)
        .json({ message: "Kelas kejuaraan tidak ditemukan" });
    }

    await conn.beginTransaction();

    // Cari peserta yang terdaftar
    const placeholders = cleanUserIds.map(() => "?").join(",");
    const [existing] = await conn.query(
      `SELECT user_id FROM peserta_kejuaraan 
       WHERE kelas_kejuaraan_id = ? AND user_id IN (${placeholders})`,
      [kelasKejuaraanId, ...cleanUserIds],
    );
    const existingUserIds = existing.map((row) => row.user_id);
    const notFoundIds = cleanUserIds.filter(
      (id) => !existingUserIds.includes(id),
    );

    if (existingUserIds.length === 0) {
      await conn.commit();
      return res
        .status(404)
        .json({
          message: "Tidak ada peserta yang ditemukan untuk dihapus",
          not_found: notFoundIds,
        });
    }

    // Hapus peserta
    const deletePlaceholders = existingUserIds.map(() => "?").join(",");
    await conn.query(
      `DELETE FROM peserta_kejuaraan 
       WHERE kelas_kejuaraan_id = ? AND user_id IN (${deletePlaceholders})`,
      [kelasKejuaraanId, ...existingUserIds],
    );

    // Ambil nama yang dihapus untuk response
    const [names] = await conn.query(
      `SELECT id, name FROM users WHERE id IN (${deletePlaceholders})`,
      existingUserIds,
    );
    const deleted = names.map((n) => ({ user_id: n.id, name: n.name }));

    await conn.commit();

    return res.status(200).json({
      message: "Bulk delete peserta selesai",
      deleted_count: existingUserIds.length,
      not_found: notFoundIds,
      deleted,
    });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    return res.status(500).json({
      message: "Gagal menghapus peserta",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
