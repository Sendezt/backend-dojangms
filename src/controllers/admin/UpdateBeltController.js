const db = require("../../config/database");

exports.updateBelt = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, dan_level, order_level } = req.body;

    const [[belt]] = await db.execute("SELECT * FROM belts WHERE id = ?", [id]);

    if (!belt) {
      return res.status(404).json({
        message: "Belt tidak ditemukan",
      });
    }

    const updated = {
      name: name ?? belt.name,
      dan_level: dan_level ?? belt.dan_level,
      order_level: order_level ?? belt.order_level,
    };

    await db.execute(
      `
      UPDATE belts
      SET name = ?, dan_level = ?, order_level = ?
      WHERE id = ?
      `,
      [updated.name, updated.dan_level, updated.order_level, id],
    );

    res.json({
      message: "Belt berhasil diperbarui",
      data: updated,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Gagal memperbarui belt",
    });
  }
};
