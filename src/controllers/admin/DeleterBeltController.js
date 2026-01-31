const db = require("../../config/database");

exports.deleteBelt = async (req, res) => {
  try {
    const { id } = req.params;

    const [[belt]] = await db.execute("SELECT id FROM belts WHERE id = ?", [
      id,
    ]);

    if (!belt) {
      return res.status(404).json({
        message: "Belt tidak ditemukan",
      });
    }

    await db.execute("DELETE FROM belts WHERE id = ?", [id]);

    res.json({
      message: "Belt berhasil dihapus",
    });
  } catch (error) {
    console.error(error);

    // biasanya gagal karena FK user_belts
    res.status(400).json({
      message: "Belt tidak bisa dihapus karena masih digunakan",
    });
  }
};
