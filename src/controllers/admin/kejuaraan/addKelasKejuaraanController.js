const db = require("../../../config/database");

exports.addKelasKejuaraan = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const kejuaraanId = parseInt(req.params.kejuaraanId);
    const { tipe, kelas_id } = req.body;

    if (!kejuaraanId || isNaN(kejuaraanId)) {
      return res.status(400).json({ message: "ID kejuaraan tidak valid" });
    }
    if (!tipe || !["kyorugi", "poomsae"].includes(tipe)) {
      return res
        .status(400)
        .json({ message: "Tipe harus kyorugi atau poomsae" });
    }
    if (!kelas_id || isNaN(kelas_id)) {
      return res.status(400).json({ message: "kelas_id harus berupa angka" });
    }

    // Cek apakah kejuaraan ada
    const [kejuaraan] = await conn.query(
      "SELECT id FROM kejuaraan WHERE id = ?",
      [kejuaraanId],
    );
    if (kejuaraan.length === 0) {
      return res.status(404).json({ message: "Kejuaraan tidak ditemukan" });
    }

    // Validasi kelas_id berdasarkan tipe
    let kelasExists = false;
    if (tipe === "kyorugi") {
      const [rows] = await conn.query(
        "SELECT id FROM kelas_kyorugi WHERE id = ?",
        [kelas_id],
      );
      if (rows.length > 0) kelasExists = true;
    } else {
      const [rows] = await conn.query(
        "SELECT id FROM kelas_poomsae WHERE id = ?",
        [kelas_id],
      );
      if (rows.length > 0) kelasExists = true;
    }
    if (!kelasExists) {
      return res
        .status(400)
        .json({ message: `kelas_id tidak ditemukan di tabel kelas_${tipe}` });
    }

    // Cek duplikat
    const [existing] = await conn.query(
      "SELECT id FROM kelas_kejuaraan WHERE kejuaraan_id = ? AND tipe = ? AND kelas_id = ?",
      [kejuaraanId, tipe, kelas_id],
    );
    if (existing.length > 0) {
      return res
        .status(409)
        .json({ message: "Kelas sudah terdaftar untuk kejuaraan ini" });
    }

    // Insert
    const [result] = await conn.query(
      "INSERT INTO kelas_kejuaraan (kejuaraan_id, tipe, kelas_id) VALUES (?, ?, ?)",
      [kejuaraanId, tipe, kelas_id],
    );

    return res.status(201).json({
      message: "Kelas kejuaraan berhasil ditambahkan",
      data: {
        id: result.insertId,
        kejuaraan_id: kejuaraanId,
        tipe,
        kelas_id,
      },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({
        message: "Gagal menambahkan kelas kejuaraan",
        error: error.message,
      });
  } finally {
    conn.release();
  }
};
