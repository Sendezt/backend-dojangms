const db = require("../../../config/database");

exports.updateHasilPeserta = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const kejuaraanId = parseInt(req.params.kejuaraanId);
    const pesertaId = parseInt(req.params.pesertaId);
    const { hasil, catatan } = req.body;

    if (isNaN(kejuaraanId) || kejuaraanId < 1) {
      return res
        .status(400)
        .json({ success: false, message: "ID kejuaraan tidak valid" });
    }
    if (isNaN(pesertaId) || pesertaId < 1) {
      return res
        .status(400)
        .json({ success: false, message: "ID peserta tidak valid" });
    }

    // Validasi hasil
    const allowedHasil = [
      "juara1",
      "juara2",
      "juara3",
      "harapan1",
      "harapan2",
      "peserta",
    ];
    if (!hasil || !allowedHasil.includes(hasil)) {
      return res.status(400).json({
        success: false,
        message: `Hasil harus salah satu: ${allowedHasil.join(", ")}`,
      });
    }

    // Cek kejuaraan dan batas waktu input
    const [kejuaraan] = await conn.query(
      "SELECT id, start_date, end_date FROM kejuaraan WHERE id = ?",
      [kejuaraanId],
    );
    if (kejuaraan.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Kejuaraan tidak ditemukan" });
    }

    const now = new Date();
    const startDate = new Date(kejuaraan[0].start_date);
    const endDate = new Date(kejuaraan[0].end_date);
    const endDatePlusOne = new Date(endDate);
    endDatePlusOne.setDate(endDatePlusOne.getDate() + 1); // H+1 setelah selesai

    if (now < startDate) {
      return res.status(403).json({
        success: false,
        message:
          "Input hasil belum dapat dilakukan karena kejuaraan belum dimulai",
      });
    }
    if (now > endDatePlusOne) {
      return res.status(403).json({
        success: false,
        message:
          "Batas waktu input hasil telah berakhir (H+1 setelah kejuaraan selesai)",
      });
    }

    // Cek apakah peserta terdaftar dalam kejuaraan ini
    const [peserta] = await conn.query(
      `SELECT p.id, p.user_id, p.hasil, p.catatan
       FROM peserta_kejuaraan p
       JOIN kelas_kejuaraan kk ON p.kelas_kejuaraan_id = kk.id
       WHERE p.id = ? AND kk.kejuaraan_id = ?`,
      [pesertaId, kejuaraanId],
    );
    if (peserta.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Peserta tidak ditemukan dalam kejuaraan ini",
      });
    }

    // Update hasil (tanpa mengubah is_edited)
    const catatanValue =
      catatan && typeof catatan === "string" ? catatan.trim() : null;
    await conn.query(
      `UPDATE peserta_kejuaraan
       SET hasil = ?, catatan = ?
       WHERE id = ?`,
      [hasil, catatanValue, pesertaId],
    );

    // Ambil data terbaru (tanpa is_edited)
    const [updated] = await conn.query(
      `SELECT id, kelas_kejuaraan_id, user_id, belt_id, hasil, catatan
       FROM peserta_kejuaraan WHERE id = ?`,
      [pesertaId],
    );

    return res.status(200).json({
      success: true,
      message: "Hasil peserta berhasil diperbarui",
      data: updated[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal memperbarui hasil peserta",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
