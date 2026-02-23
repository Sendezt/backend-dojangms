const db = require("../../config/database");

exports.deleteChampionship = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "ID championship wajib diisi",
      });
    }

    // cek data ada atau tidak
    const [check] = await db.execute(
      "SELECT id FROM kejuaraan WHERE id = ?",
      [id],
    );

    if (check.length === 0) {
      return res.status(404).json({
        message: "Championship tidak ditemukan",
      });
    }

    await db.execute("DELETE FROM kejuaraan WHERE id = ?", [id]);

    res.json({
      message: "Championship berhasil dihapus",
    });
  } catch (error) {
    console.error(error);

    // FK constraint error (misal sudah ada participant)
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(400).json({
        message:
          "Championship tidak bisa dihapus karena masih memiliki peserta",
      });
    }

    res.status(500).json({
      message: "Terjadi kesalahan pada server",
    });
  }
};
