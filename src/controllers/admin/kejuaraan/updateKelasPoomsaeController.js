const db = require("../../../config/database");

exports.updateKelasPoomsae = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id < 1)
      return res.status(400).json({ message: "ID tidak valid" });

    const { kategori_usia_id, level_kelas_id, gender, jurus_id, format_id } =
      req.body;

    // Cek keberadaan data
    const [existing] = await conn.query(
      "SELECT * FROM kelas_poomsae WHERE id = ?",
      [id],
    );
    if (existing.length === 0)
      return res.status(404).json({ message: "Kelas poomsae tidak ditemukan" });

    // Gunakan nilai lama jika tidak dikirim
    const finalKategori =
      kategori_usia_id !== undefined
        ? kategori_usia_id
        : existing[0].kategori_usia_id;
    const finalLevel =
      level_kelas_id !== undefined
        ? level_kelas_id
        : existing[0].level_kelas_id;
    const finalGender =
      gender !== undefined
        ? gender === ""
          ? null
          : gender
        : existing[0].gender;
    const finalJurus = jurus_id !== undefined ? jurus_id : existing[0].jurus_id;
    const finalFormat =
      format_id !== undefined ? format_id : existing[0].format_id;

    // Validasi tipe dan nilai
    if (
      kategori_usia_id !== undefined &&
      (isNaN(kategori_usia_id) || kategori_usia_id < 1)
    )
      return res.status(400).json({ message: "ID kategori usia tidak valid" });
    if (
      level_kelas_id !== undefined &&
      (isNaN(level_kelas_id) || level_kelas_id < 1)
    )
      return res.status(400).json({ message: "ID level kelas tidak valid" });
    if (
      gender !== undefined &&
      gender !== null &&
      !["putra", "putri"].includes(gender)
    )
      return res
        .status(400)
        .json({ message: "Gender harus 'putra' atau 'putri' (atau null)" });
    if (jurus_id !== undefined && (isNaN(jurus_id) || jurus_id < 1))
      return res.status(400).json({ message: "ID jurus tidak valid" });
    if (format_id !== undefined && (isNaN(format_id) || format_id < 1))
      return res.status(400).json({ message: "ID format tidak valid" });

    // Validasi foreign key
    const [kategori] = await conn.query(
      "SELECT id FROM kategori_usia WHERE id = ?",
      [finalKategori],
    );
    if (!kategori.length)
      return res.status(404).json({ message: "Kategori usia tidak ditemukan" });
    const [level] = await conn.query(
      "SELECT id FROM level_kelas WHERE id = ?",
      [finalLevel],
    );
    if (!level.length)
      return res.status(404).json({ message: "Level kelas tidak ditemukan" });
    const [jurus] = await conn.query(
      "SELECT id FROM poomsae_jurus WHERE id = ?",
      [finalJurus],
    );
    if (!jurus.length)
      return res.status(404).json({ message: "Jurus tidak ditemukan" });
    const [format] = await conn.query(
      "SELECT id FROM poomsae_format WHERE id = ?",
      [finalFormat],
    );
    if (!format.length)
      return res.status(404).json({ message: "Format tidak ditemukan" });

    // Cek duplikasi (kecuali diri sendiri)
    const [duplicate] = await conn.query(
      `SELECT id FROM kelas_poomsae 
       WHERE kategori_usia_id = ? AND level_kelas_id = ? AND jurus_id = ? AND format_id = ? 
       AND (gender = ? OR (gender IS NULL AND ? IS NULL)) AND id != ?`,
      [
        finalKategori,
        finalLevel,
        finalJurus,
        finalFormat,
        finalGender,
        finalGender,
        id,
      ],
    );
    if (duplicate.length) {
      return res
        .status(409)
        .json({ message: "Kelas poomsae dengan kombinasi tersebut sudah ada" });
    }

    // Update database
    await conn.query(
      `UPDATE kelas_poomsae 
       SET kategori_usia_id = ?, level_kelas_id = ?, gender = ?, jurus_id = ?, format_id = ? 
       WHERE id = ?`,
      [finalKategori, finalLevel, finalGender, finalJurus, finalFormat, id],
    );

    // Ambil data terbaru untuk response (opsional)
    const [updated] = await conn.query(
      `SELECT id, gender, kategori_usia_id, level_kelas_id, jurus_id, format_id 
       FROM kelas_poomsae WHERE id = ?`,
      [id],
    );
    res.status(200).json({
      success: true,
      message: "Kelas poomsae berhasil diperbarui",
      data: updated[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Gagal memperbarui kelas poomsae",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
