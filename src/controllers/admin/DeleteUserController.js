const db = require("../../config/database");

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "ID user wajib diisi",
      });
    }

    // cek user ada atau tidak
    const [rows] = await db.execute("SELECT id FROM users WHERE id = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        message: "User tidak ditemukan",
      });
    }

    await db.execute("DELETE FROM users WHERE id = ?", [id]);

    res.status(200).json({
      message: "User berhasil dihapus",
    });
  } catch (error) {
    console.error(error);

    // FK constraint (user masih punya relasi)
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(400).json({
        message: "User tidak bisa dihapus karena masih memiliki relasi data",
      });
    }

    res.status(500).json({
      message: "Terjadi kesalahan pada server",
    });
  }
};
