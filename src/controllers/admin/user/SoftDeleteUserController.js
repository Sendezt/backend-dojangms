const db = require("../../../config/database");

exports.softDeleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
    message: "ID user wajib diisi",
      });
    }

    // cek user ada atau tidak
    const [rows] = await db.execute(
      "SELECT id, status FROM users WHERE id = ?",
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "User tidak ditemukan",
      });
    }

    // cek apakah sudah inactive
    if (rows[0].status === "inactive") {
      return res.status(400).json({
        message: "User sudah dalam status inactive",
      });
    }

    // ubah status menjadi inactive (soft delete)
    await db.execute("UPDATE users SET status = 'inactive' WHERE id = ?", [id]);

    res.status(200).json({
      message: "User berhasil dinonaktifkan (soft delete)",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Terjadi kesalahan pada server",
    });
  }
};
