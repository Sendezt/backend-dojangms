// src/controllers/admin/kejuaraan/deleteKejuaraanController.js
const db = require("../../../config/database");

exports.deleteKejuaraan = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id < 1) {
      return res.status(400).json({ message: "ID kejuaraan tidak valid" });
    }

    // Cek kejuaraan
    const [kejuaraan] = await conn.query(
      "SELECT id, name, start_date, end_date FROM kejuaraan WHERE id = ?",
      [id],
    );
    if (kejuaraan.length === 0) {
      return res.status(404).json({ message: "Kejuaraan tidak ditemukan" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(kejuaraan[0].start_date);
    const endDate = new Date(kejuaraan[0].end_date);

    const isOngoing = startDate <= today && endDate >= today;
    const isFinished = endDate < today;
    const isUpcoming = startDate > today;

    // Aturan: tidak boleh hapus jika sedang berlangsung atau sudah selesai
    if (isOngoing) {
      return res
        .status(409)
        .json({
          message: "Kejuaraan yang sedang berlangsung tidak dapat dihapus",
        });
    }
    if (isFinished) {
      return res
        .status(409)
        .json({ message: "Kejuaraan yang sudah selesai tidak dapat dihapus" });
    }

    // Jika akan datang, cek apakah sudah memiliki peserta
    if (isUpcoming) {
      const [peserta] = await conn.query(
        `SELECT pk.id 
         FROM peserta_kejuaraan pk
         JOIN kelas_kejuaraan kk ON pk.kelas_kejuaraan_id = kk.id
         WHERE kk.kejuaraan_id = ?
         LIMIT 1`,
        [id],
      );
      if (peserta.length > 0) {
        return res.status(409).json({
          message:
            "Kejuaraan yang akan datang namun sudah memiliki peserta tidak dapat dihapus. Hapus peserta terlebih dahulu.",
        });
      }
    }

    // (Opsional) Cek apakah masih ada kelas pertandingan
    const [kelasKejuaraan] = await conn.query(
      "SELECT id FROM kelas_kejuaraan WHERE kejuaraan_id = ? LIMIT 1",
      [id],
    );
    if (kelasKejuaraan.length > 0) {
      return res.status(409).json({
        message:
          "Kejuaraan masih memiliki kelas pertandingan. Hapus semua kelas kejuaraan terlebih dahulu.",
      });
    }

    // Hapus kejuaraan
    await conn.query("DELETE FROM kejuaraan WHERE id = ?", [id]);

    res.status(200).json({
      message: `Kejuaraan "${kejuaraan[0].name}" berhasil dihapus`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Gagal menghapus kejuaraan",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
