const db = require("../../../config/database");

exports.submitHasilUjian = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const ujianId = parseInt(req.params.ujianId);
    const pesertaId = parseInt(req.params.pesertaId);
    const { status } = req.body;

    if (isNaN(ujianId) || ujianId < 1) {
      return res
        .status(400)
        .json({ success: false, message: "ID ujian tidak valid" });
    }
    if (isNaN(pesertaId) || pesertaId < 1) {
      return res
        .status(400)
        .json({ success: false, message: "ID peserta tidak valid" });
    }
    if (!status || !["lulus", "tidak_lulus"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status harus 'lulus' atau 'tidak_lulus'",
      });
    }

    // Mulai transaksi
    await conn.beginTransaction();

    // 1. Cek ujian dan validasi periode input (H+1 sampai 1 bulan setelah selesai)
    const [ujianCheck] = await conn.query(
      `SELECT id, tanggal_selesai FROM ujian_sabuk 
       WHERE id = ? AND deleted_at IS NULL`,
      [ujianId],
    );
    if (ujianCheck.length === 0) {
      await conn.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Ujian tidak ditemukan" });
    }

    // Validasi periode menggunakan SQL CURDATE()
    const [periodeCheck] = await conn.query(
      `SELECT id FROM ujian_sabuk 
       WHERE id = ? 
       AND DATE_ADD(tanggal_selesai, INTERVAL 1 DAY) <= CURDATE()
       AND DATE_ADD(tanggal_selesai, INTERVAL 1 MONTH) >= CURDATE()`,
      [ujianId],
    );
    if (periodeCheck.length === 0) {
      await conn.rollback();
      return res.status(403).json({
        success: false,
        message:
          "Input hasil ujian hanya dapat dilakukan mulai H+1 sampai 1 bulan setelah tanggal selesai",
      });
    }

    // 2. Cek peserta ujian
    const [peserta] = await conn.query(
      `SELECT pu.id, pu.user_id, pu.belt_asal_id, pu.belt_tujuan_id, pu.status, pu.tanggal_lulus
       FROM peserta_ujian pu
       WHERE pu.id = ? AND pu.ujian_id = ?`,
      [pesertaId, ujianId],
    );
    if (peserta.length === 0) {
      await conn.rollback();
      return res.status(404).json({
        success: false,
        message: "Peserta tidak ditemukan dalam ujian ini",
      });
    }

    // 3. Cek apakah sudah pernah diinput (tanggal_lulus tidak null)
    if (peserta[0].tanggal_lulus !== null) {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        message:
          "Hasil ujian peserta sudah pernah diinput dan tidak dapat diubah",
      });
    }

    const userId = peserta[0].user_id;
    const beltTujuanId = peserta[0].belt_tujuan_id;
    const nowStr = new Date().toISOString().slice(0, 19).replace("T", " ");

    // 4. Update status peserta_ujian (set status dan tanggal_lulus, tanggal_edit tetap NULL)
    await conn.query(
      `UPDATE peserta_ujian 
       SET status = ?, tanggal_lulus = ?, tanggal_edit = NULL
       WHERE id = ?`,
      [status, nowStr, pesertaId],
    );

    // 5. Jika lulus, tambahkan sabuk baru di user_belts
    if (status === "lulus") {
      // Pastikan belt_tujuan_id valid
      const [beltTujuan] = await conn.query(
        "SELECT id FROM belts WHERE id = ?",
        [beltTujuanId],
      );
      if (beltTujuan.length === 0) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: "Belt tujuan tidak ditemukan",
        });
      }

      // Non-aktifkan semua sabuk user (is_current = 0)
      await conn.query(
        "UPDATE user_belts SET is_current = 0 WHERE user_id = ?",
        [userId],
      );

      // Tambahkan sabuk baru dengan is_current = 1
      await conn.query(
        `INSERT INTO user_belts (user_id, belt_id, is_current, achieved_at)
         VALUES (?, ?, 1, ?)`,
        [userId, beltTujuanId, nowStr.split(" ")[0]], // tanggal sekarang
      );
    }

    // Commit transaksi
    await conn.commit();

    // Ambil data terbaru untuk response
    const [updated] = await conn.query(
      `SELECT pu.id, pu.user_id, pu.belt_asal_id, pu.belt_tujuan_id, pu.status, pu.tanggal_lulus, pu.tanggal_edit
       FROM peserta_ujian pu
       WHERE pu.id = ?`,
      [pesertaId],
    );

    return res.status(200).json({
      success: true,
      message:
        status === "lulus"
          ? "Peserta dinyatakan lulus dan sabuk berhasil diperbarui"
          : "Peserta dinyatakan tidak lulus",
      data: updated[0],
    });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal submit hasil ujian",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
