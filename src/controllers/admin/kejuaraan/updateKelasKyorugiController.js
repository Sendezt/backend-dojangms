const db = require("../../../config/database");

exports.updateKelasKyorugi = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id || isNaN(id) || id < 1) {
      return res
        .status(400)
        .json({ success: false, message: "ID kelas kyorugi tidak valid" });
    }

    const {
      kategori_usia_id,
      level_kelas_id,
      gender,
      label,
      batas_bawah,
      batas_atas,
    } = req.body;

    // Cek apakah data dengan id tersebut ada
    const [existing] = await db.query(
      "SELECT * FROM kelas_kyorugi WHERE id = ?",
      [id],
    );
    if (existing.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Kelas kyorugi tidak ditemukan" });
    }

    // Gunakan nilai lama jika tidak dikirim
    const finalKategoriUsiaId =
      kategori_usia_id !== undefined
        ? kategori_usia_id
        : existing[0].kategori_usia_id;
    const finalLevelKelasId =
      level_kelas_id !== undefined
        ? level_kelas_id
        : existing[0].level_kelas_id;
    const finalGender = gender !== undefined ? gender : existing[0].gender;
    const finalLabel = label !== undefined ? label : existing[0].label;
    let finalBatasBawah =
      batas_bawah !== undefined ? batas_bawah : existing[0].batas_bawah;
    let finalBatasAtas =
      batas_atas !== undefined ? batas_atas : existing[0].batas_atas;

    // Validasi input
    if (
      kategori_usia_id !== undefined &&
      (isNaN(kategori_usia_id) || kategori_usia_id < 1)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "ID kategori usia tidak valid" });
    }
    if (
      level_kelas_id !== undefined &&
      (isNaN(level_kelas_id) || level_kelas_id < 1)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "ID level kelas tidak valid" });
    }
    if (gender !== undefined && !["putra", "putri"].includes(gender)) {
      return res
        .status(400)
        .json({ success: false, message: "Gender harus 'putra' atau 'putri'" });
    }
    if (
      label !== undefined &&
      (typeof finalLabel !== "string" || finalLabel.trim() === "")
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Label wajib diisi" });
    }

    // Ekstrak angka dari label
    const match = finalLabel.match(/\d+/);
    if (!match) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Label harus mengandung angka (contoh: under-42)",
        });
    }
    const maxBatasDariLabel = parseInt(match[0], 10);

    // Validasi batas berat
    if (batas_bawah !== undefined && batas_atas !== undefined) {
      const bawah = parseFloat(finalBatasBawah);
      const atas = parseFloat(finalBatasAtas);
      if (isNaN(bawah) || isNaN(atas)) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Batas bawah dan batas atas harus berupa angka",
          });
      }
      if (bawah >= atas) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Batas bawah harus lebih kecil dari batas atas",
          });
      }
      if (atas > maxBatasDariLabel) {
        return res
          .status(400)
          .json({
            success: false,
            message: `Batas atas tidak boleh melebihi ${maxBatasDariLabel} kg (sesuai label)`,
          });
      }
    } else if (batas_bawah !== undefined || batas_atas !== undefined) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Batas bawah dan batas atas harus diisi bersama-sama",
        });
    }

    // Cek foreign key
    if (kategori_usia_id !== undefined) {
      const [kategori] = await db.query(
        "SELECT id FROM kategori_usia WHERE id = ?",
        [finalKategoriUsiaId],
      );
      if (kategori.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Kategori usia tidak ditemukan" });
      }
    }
    if (level_kelas_id !== undefined) {
      const [level] = await db.query(
        "SELECT id FROM level_kelas WHERE id = ?",
        [finalLevelKelasId],
      );
      if (level.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Level kelas tidak ditemukan" });
      }
    }

    // Cegah duplikasi
    const [duplicate] = await db.query(
      `SELECT id FROM kelas_kyorugi
       WHERE kategori_usia_id = ? AND level_kelas_id = ? AND gender = ? AND label = ? AND id != ?`,
      [
        finalKategoriUsiaId,
        finalLevelKelasId,
        finalGender,
        finalLabel.trim(),
        id,
      ],
    );
    if (duplicate.length > 0) {
      return res
        .status(409)
        .json({
          success: false,
          message: "Kelas kyorugi dengan kombinasi tersebut sudah ada",
        });
    }

    // Siapkan nilai update
    const updateBatasBawah =
      finalBatasBawah !== undefined && finalBatasBawah !== null
        ? parseFloat(finalBatasBawah)
        : null;
    const updateBatasAtas =
      finalBatasAtas !== undefined && finalBatasAtas !== null
        ? parseFloat(finalBatasAtas)
        : null;

    // Update database
    await db.query(
      `UPDATE kelas_kyorugi
       SET kategori_usia_id = ?, level_kelas_id = ?, gender = ?, label = ?, batas_bawah = ?, batas_atas = ?
       WHERE id = ?`,
      [
        finalKategoriUsiaId,
        finalLevelKelasId,
        finalGender,
        finalLabel.trim(),
        updateBatasBawah,
        updateBatasAtas,
        id,
      ],
    );

    // Ambil data terbaru untuk response (tanpa min_age dan max_age)
    const [updated] = await db.query(
      `SELECT 
         ky.id,
         ky.gender,
         ky.label,
         ky.batas_bawah,
         ky.batas_atas,
         ku.id AS kategori_usia_id,
         ku.name AS kategori_usia_nama,
         lk.id AS level_kelas_id,
         lk.name AS level_kelas_nama
       FROM kelas_kyorugi ky
       JOIN kategori_usia ku ON ku.id = ky.kategori_usia_id
       JOIN level_kelas lk ON lk.id = ky.level_kelas_id
       WHERE ky.id = ?`,
      [id],
    );
    const row = updated[0];
    const responseData = {
      id: row.id,
      gender: row.gender,
      label: row.label,
      batas_bawah: row.batas_bawah,
      batas_atas: row.batas_atas,
      kategori_usia: {
        id: row.kategori_usia_id,
        nama: row.kategori_usia_nama,
      },
      level_kelas: {
        id: row.level_kelas_id,
        nama: row.level_kelas_nama,
      },
    };

    return res.status(200).json({
      success: true,
      message: "Kelas kyorugi berhasil diperbarui",
      data: responseData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal memperbarui kelas kyorugi",
      error: error.message,
    });
  }
};
