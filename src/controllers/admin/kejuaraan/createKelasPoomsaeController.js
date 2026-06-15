const db = require("../../../config/database");

exports.createKelasPoomsae = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const { kategori_usia_id, level_kelas_id, gender, jurus_id, format_id } =
      req.body;

    // Validasi input dasar
    if (!kategori_usia_id || isNaN(kategori_usia_id) || kategori_usia_id < 1) {
      return res.status(400).json({ message: "ID kategori usia tidak valid" });
    }
    if (!level_kelas_id || isNaN(level_kelas_id) || level_kelas_id < 1) {
      return res.status(400).json({ message: "ID level kelas tidak valid" });
    }
    if (!jurus_id || isNaN(jurus_id) || jurus_id < 1) {
      return res.status(400).json({ message: "ID jurus tidak valid" });
    }
    if (!format_id || isNaN(format_id) || format_id < 1) {
      return res.status(400).json({ message: "ID format tidak valid" });
    }
    if (gender && !["putra", "putri"].includes(gender)) {
      return res
        .status(400)
        .json({
          message:
            "Gender harus 'putra' atau 'putri' (atau kosongkan jika format campuran)",
        });
    }
    const finalGender = gender || null;

    // Cek foreign key
    const [kategori] = await conn.query(
      "SELECT id FROM kategori_usia WHERE id = ?",
      [kategori_usia_id],
    );
    if (kategori.length === 0) {
      return res.status(404).json({ message: "Kategori usia tidak ditemukan" });
    }
    const [level] = await conn.query(
      "SELECT id FROM level_kelas WHERE id = ?",
      [level_kelas_id],
    );
    if (level.length === 0) {
      return res.status(404).json({ message: "Level kelas tidak ditemukan" });
    }
    const [jurus] = await conn.query(
      "SELECT id FROM poomsae_jurus WHERE id = ?",
      [jurus_id],
    );
    if (jurus.length === 0) {
      return res.status(404).json({ message: "Jurus tidak ditemukan" });
    }
    const [format] = await conn.query(
      "SELECT id FROM poomsae_format WHERE id = ?",
      [format_id],
    );
    if (format.length === 0) {
      return res.status(404).json({ message: "Format tidak ditemukan" });
    }

    // Cegah duplikasi (kombinasi unik)
    const [existing] = await conn.query(
      `SELECT id FROM kelas_poomsae
       WHERE kategori_usia_id = ? AND level_kelas_id = ? AND jurus_id = ? AND format_id = ? AND (gender = ? OR (gender IS NULL AND ? IS NULL))`,
      [
        kategori_usia_id,
        level_kelas_id,
        jurus_id,
        format_id,
        finalGender,
        finalGender,
      ],
    );
    if (existing.length > 0) {
      return res.status(409).json({
        message: "Kelas poomsae dengan kombinasi tersebut sudah ada",
      });
    }

    const [result] = await conn.query(
      `INSERT INTO kelas_poomsae (kategori_usia_id, level_kelas_id, gender, jurus_id, format_id)
       VALUES (?, ?, ?, ?, ?)`,
      [kategori_usia_id, level_kelas_id, finalGender, jurus_id, format_id],
    );

    return res.status(201).json({
      message: "Kelas poomsae berhasil ditambahkan",
      data: {
        id: result.insertId,
        kategori_usia_id,
        level_kelas_id,
        gender: finalGender,
        jurus_id,
        format_id,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal menambahkan kelas poomsae",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
