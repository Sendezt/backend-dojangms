const db = require("../../../config/database");

exports.editHasilPeserta = async (req, res) => {
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

    // Cek kejuaraan dan batas waktu edit (setelah H+1)
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
    const endDate = new Date(kejuaraan[0].end_date);
    const endDatePlusOne = new Date(endDate);
    endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);

    // Edit hanya bisa dilakukan SETELAH H+1 selesai (yaitu > endDate+1)
    if (now <= endDatePlusOne) {
      return res.status(403).json({
        success: false,
        message:
          "Edit hasil hanya dapat dilakukan setelah H+1 kejuaraan selesai",
      });
    }

    // Cek peserta
    const [peserta] = await conn.query(
      `SELECT p.id, p.is_edited
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

    // Cek apakah sudah pernah diedit sebelumnya
    if (peserta[0].is_edited === 1) {
      return res.status(409).json({
        success: false,
        message:
          "Hasil peserta ini sudah pernah diedit dan tidak dapat diedit lagi",
      });
    }

    // Update hasil dan set is_edited = 1
    const catatanValue =
      catatan && typeof catatan === "string" ? catatan.trim() : null;
    await conn.query(
      `UPDATE peserta_kejuaraan
       SET hasil = ?, catatan = ?, is_edited = 1
       WHERE id = ?`,
      [hasil, catatanValue, pesertaId],
    );

    // Ambil data terbaru
    const [updated] = await conn.query(
      `SELECT id, kelas_kejuaraan_id, user_id, belt_id, hasil, catatan, is_edited
       FROM peserta_kejuaraan WHERE id = ?`,
      [pesertaId],
    );

    return res.status(200).json({
      success: true,
      message: "Hasil peserta berhasil diedit",
      data: updated[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengedit hasil peserta",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
