const db = require("../../../config/database");

exports.deletePengumuman = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id < 1) {
      return res.status(400).json({ message: "ID pengumuman tidak valid" });
    }

    // Cek data pengumuman
    const [rows] = await conn.query(
      "SELECT id, status FROM pengumuman WHERE id = ?",
      [id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Pengumuman tidak ditemukan" });
    }
    const current = rows[0];

    // ===== ATURAN: Tidak boleh hapus jika sudah terkirim =====
    if (current.status === "terkirim") {
      return res.status(403).json({
        message: "Pengumuman yang sudah terkirim tidak dapat dihapus",
      });
    }

    // Hapus (CASCADE akan menghapus target_user dan log WA otomatis)
    await conn.query("DELETE FROM pengumuman WHERE id = ?", [id]);

    return res.status(200).json({
      success: true,
      message: "Pengumuman berhasil dihapus",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal menghapus pengumuman",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
