const db = require("../../../config/database");

exports.createKelas = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const { nama, deskripsi, status } = req.body;

    // Validasi input
    if (!nama || typeof nama !== "string" || nama.trim() === "") {
      return res.status(400).json({ message: "Nama kelas wajib diisi" });
    }

    // Validasi status (opsional)
    let finalStatus = "aktif";
    if (status && ["aktif", "nonaktif"].includes(status)) {
      finalStatus = status;
    } else if (status) {
      return res
        .status(400)
        .json({ message: "Status harus 'aktif' atau 'nonaktif'" });
    }

    // Cek apakah nama kelas sudah ada (opsional)
    const [existing] = await conn.query("SELECT id FROM kelas WHERE nama = ?", [
      nama.trim(),
    ]);
    if (existing.length > 0) {
      return res.status(409).json({ message: "Nama kelas sudah digunakan" });
    }

    // Insert kelas
    const [result] = await conn.query(
      `INSERT INTO kelas (nama, deskripsi, status) VALUES (?, ?, ?)`,
      [nama.trim(), deskripsi || null, finalStatus],
    );

    // Ambil data yang baru dibuat
    const [newKelas] = await conn.query(
      "SELECT id, nama, deskripsi, status, created_at FROM kelas WHERE id = ?",
      [result.insertId],
    );

    return res.status(201).json({
      message: "Kelas berhasil ditambahkan",
      data: newKelas[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal menambahkan kelas",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
