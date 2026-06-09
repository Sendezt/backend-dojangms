const db = require("../../../config/database");

exports.deleteKelasKyorugi = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id || isNaN(id) || id < 1) {
      return res
        .status(400)
        .json({ success: false, message: "ID kelas kyorugi tidak valid" });
    }

    // Cek apakah data dengan id tersebut ada
    const [existing] = await db.query(
      "SELECT id, label FROM kelas_kyorugi WHERE id = ?",
      [id],
    );
    if (existing.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Kelas kyorugi tidak ditemukan" });
    }

    // Cek apakah kelas ini sudah digunakan di kelas_kejuaraan
    const [used] = await db.query(
      "SELECT id FROM kelas_kejuaraan WHERE tipe = 'kyorugi' AND kelas_id = ? LIMIT 1",
      [id],
    );
    if (used.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Kelas kyorugi tidak dapat dihapus karena sudah digunakan dalam kejuaraan. Hapus terlebih dahulu relasi kelas kejuaraan.",
      });
    }

    // Hapus data
    await db.query("DELETE FROM kelas_kyorugi WHERE id = ?", [id]);

    return res.status(200).json({
      success: true,
      message: `Kelas kyorugi "${existing[0].label}" berhasil dihapus`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal menghapus kelas kyorugi",
      error: error.message,
    });
  }
};
