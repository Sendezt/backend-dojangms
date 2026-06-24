const db = require("../../../config/database");

exports.createKelasKyorugi = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const {
      kategori_usia_id,
      level_kelas_id,
      gender,
      label,
      batas_bawah,
      batas_atas,
    } = req.body;

    // Validasi input dasar
    if (!kategori_usia_id || isNaN(kategori_usia_id) || kategori_usia_id < 1) {
      return res.status(400).json({ message: "ID kategori usia tidak valid" });
    }
    if (!level_kelas_id || isNaN(level_kelas_id) || level_kelas_id < 1) {
      return res.status(400).json({ message: "ID level kelas tidak valid" });
    }
    if (!gender || !["putra", "putri"].includes(gender)) {
      return res
        .status(400)
        .json({ message: "Gender harus 'putra' atau 'putri'" });
    }
    if (!label || typeof label !== "string" || label.trim() === "") {
      return res.status(400).json({ message: "Label wajib diisi" });
    }

    // Ekstrak angka dari label (contoh "under-42" -> 42)
    const match = label.match(/\d+/);
    if (!match) {
      return res
        .status(400)
        .json({ message: "Label harus mengandung angka (contoh: under-42)" });
    }
    const maxBatasDariLabel = parseInt(match[0], 10);

    // Cek overlap interval dengan data existing (hanya jika kedua batas diisi)
    if (batas_bawah !== undefined && batas_atas !== undefined) {
      const bawah = parseFloat(batas_bawah);
      const atas = parseFloat(batas_atas);

      const [overlap] = await conn.query(
        `SELECT id, label, batas_bawah, batas_atas FROM kelas_kyorugi
        WHERE kategori_usia_id = ? AND level_kelas_id = ? AND gender = ?
        AND batas_bawah IS NOT NULL AND batas_atas IS NOT NULL
        AND NOT (batas_atas < ? OR batas_bawah > ?)`,
        [kategori_usia_id, level_kelas_id, gender, bawah, atas],
      );
      if (overlap.length > 0) {
        const conflicting = overlap[0];
        return res.status(409).json({
          message: `Rentang berat (${bawah} - ${atas} kg) overlap dengan kelas "${conflicting.label}" (${conflicting.batas_bawah} - ${conflicting.batas_atas} kg)`,
        });
      }
    }

    // Validasi batas_bawah dan batas_atas
    if (batas_bawah !== undefined && batas_atas !== undefined) {
      const bawah = parseFloat(batas_bawah);
      const atas = parseFloat(batas_atas);
      if (isNaN(bawah) || isNaN(atas)) {
        return res
          .status(400)
          .json({ message: "Batas bawah dan batas atas harus berupa angka" });
      }
      if (bawah >= atas) {
        return res
          .status(400)
          .json({ message: "Batas bawah harus lebih kecil dari batas atas" });
      }
      if (atas > maxBatasDariLabel) {
        return res.status(400).json({
          message: `Batas atas tidak boleh melebihi ${maxBatasDariLabel} kg (sesuai label)`,
        });
      }
    } else if (batas_bawah !== undefined || batas_atas !== undefined) {
      // Jika salah satu diisi, wajib keduanya
      return res.status(400).json({
        message: "Batas bawah dan batas atas harus diisi bersama-sama",
      });
    }

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

    // Cegah duplikasi
    const [existing] = await conn.query(
      `SELECT id FROM kelas_kyorugi
       WHERE kategori_usia_id = ? AND level_kelas_id = ? AND gender = ? AND label = ?`,
      [kategori_usia_id, level_kelas_id, gender, label.trim()],
    );
    if (existing.length > 0) {
      return res.status(409).json({
        message: "Kelas kyorugi dengan kombinasi tersebut sudah ada",
      });
    }

    // Siapkan nilai untuk insert
    const insertBatasBawah =
      batas_bawah !== undefined ? parseFloat(batas_bawah) : null;
    const insertBatasAtas =
      batas_atas !== undefined ? parseFloat(batas_atas) : null;

    const [result] = await conn.query(
      `INSERT INTO kelas_kyorugi (kategori_usia_id, level_kelas_id, gender, label, batas_bawah, batas_atas)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        kategori_usia_id,
        level_kelas_id,
        gender,
        label.trim(),
        insertBatasBawah,
        insertBatasAtas,
      ],
    );

    return res.status(201).json({
      message: "Kelas kyorugi berhasil ditambahkan",
      data: {
        id: result.insertId,
        kategori_usia_id,
        level_kelas_id,
        gender,
        label: label.trim(),
        batas_bawah: insertBatasBawah,
        batas_atas: insertBatasAtas,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal menambahkan kelas kyorugi",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
