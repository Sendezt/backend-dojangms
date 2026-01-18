const db = require("../../config/database");

exports.createChampionship = async (req, res) => {
  try {
    const { name, level, location, start_date, end_date } = req.body;

    if (!name || !level || !start_date || !end_date || !location) {
      return res.status(400).json({
        message: "name, level, location, start_date, dan end_date wajib diisi",
      });
    }

    const allowedLevels = ["kota", "provinsi", "nasional", "internasional"];
    if (!allowedLevels.includes(level)) {
      return res.status(400).json({
        message: "level tidak valid",
      });
    }

    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({
        message: "start_date tidak boleh lebih besar dari end_date",
      });
    }

    const query = `INSERT INTO championships(name, level, location, start_date, end_date) VALUES (?,?,?,?,?)`;

    const [result] = await db.execute(query, [
      name,
      level,
      location,
      start_date,
      end_date,
    ]);

    res.status(201).json({
      message: "Championship berhasil ditambahkan",
      data: {
        id: result.insertId,
        name,
        level,
        location,
        start_date,
        end_date,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Terjadi kesalahan pada server",
    });
  }
};
