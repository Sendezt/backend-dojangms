const db = require("../../config/database");

exports.createBelt = async (req, res) => {
  try {
    const { name, dan_level, order_level } = req.body;

    if (!name || !order_level) {
      return res.status(400).json({
        message: "name dan order_level wajib diisi",
      });
    }

    const query = `
      INSERT INTO belts (name, dan_level, order_level)
      VALUES (?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      name,
      dan_level || null,
      order_level,
    ]);

    res.status(201).json({
      message: "Belt berhasil ditambahkan",
      data: {
        id: result.insertId,
        name,
        dan_level,
        order_level,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Gagal menambahkan belt",
    });
  }
};
