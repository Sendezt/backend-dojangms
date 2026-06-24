const db = require("../../../config/database");

exports.createLiburGlobal = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { tanggal, keterangan } = req.body;

    if (!tanggal || isNaN(Date.parse(tanggal))) {
      return res
        .status(400)
        .json({ message: "Tanggal harus diisi dan format YYYY-MM-DD" });
    }

    const [existing] = await conn.query(
      "SELECT id FROM libur_global WHERE tanggal = ?",
      [tanggal],
    );
    if (existing.length > 0) {
      return res
        .status(409)
        .json({ message: "Tanggal sudah terdaftar sebagai libur global" });
    }

    const [result] = await conn.query(
      "INSERT INTO libur_global (tanggal, keterangan) VALUES (?, ?)",
      [tanggal, keterangan || null],
    );

    const [newLibur] = await conn.query(
      "SELECT id, tanggal, keterangan, created_at FROM libur_global WHERE id = ?",
      [result.insertId],
    );

    return res.status(201).json({
      message: "Libur global berhasil ditambahkan",
      data: newLibur[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal menambahkan libur global",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
