// src/controllers/admin/kejuaraan/deleteKelasKejuaraanController.js
const db = require("../../../config/database");

exports.deleteKelasKejuaraan = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const kelasKejuaraanId = parseInt(req.params.kelasKejuaraanId);
    if (isNaN(kelasKejuaraanId) || kelasKejuaraanId < 1) {
      return res
        .status(400)
        .json({ message: "ID kelas kejuaraan tidak valid" });
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

    // Cek apakah sudah ada peserta yang terdaftar
    const [peserta] = await conn.query(
      "SELECT id FROM peserta_kejuaraan WHERE kelas_kejuaraan_id = ? LIMIT 1",
      [kelasKejuaraanId],
    );
    if (peserta.length > 0) {
      return res.status(409).json({
        message:
          "Kelas kejuaraan tidak dapat dihapus karena sudah memiliki peserta. Hapus peserta terlebih dahulu.",
      });
    }

    // Hapus kelas kejuaraan
    await conn.query("DELETE FROM kelas_kejuaraan WHERE id = ?", [
      kelasKejuaraanId,
    ]);

    res.status(200).json({
      success: true,
      message: "Kelas kejuaraan berhasil dihapus",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Gagal menghapus kelas kejuaraan",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
