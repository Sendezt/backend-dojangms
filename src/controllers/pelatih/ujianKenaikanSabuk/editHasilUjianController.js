// src\controllers\pelatih\ujianKenaikanSabuk\editHasilUjianController.js
const db = require("../../../config/database");

exports.editHasilUjian = async (req, res) => {
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

    const [periodeCheck] = await conn.query(
      `SELECT id FROM ujian_sabuk 
       WHERE id = ? 
       AND DATE_ADD(tanggal_selesai, INTERVAL 1 DAY) <= CURDATE()
       AND DATE_ADD(tanggal_selesai, INTERVAL 3 MONTH) >= CURDATE()`,
      [ujianId],
    );
    if (periodeCheck.length === 0) {
      await conn.rollback();
      return res.status(403).json({
        success: false,
        message:
          "Edit hasil ujian hanya dapat dilakukan mulai H+1 sampai 3 bulan setelah tanggal selesai",
      });
    }

    // 2. Cek peserta ujian
    const [peserta] = await conn.query(
      `SELECT pu.id, pu.user_id, pu.belt_asal_id, pu.belt_tujuan_id, pu.status AS old_status, pu.tanggal_lulus, pu.tanggal_edit
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

    // ===== VALIDASI TAMBAHAN: cek apakah sudah pernah diedit =====
    if (peserta[0].tanggal_edit !== null) {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        message: "Hasil ujian sudah pernah diedit dan tidak dapat diubah lagi",
      });
    }

    const oldStatus = peserta[0].old_status;
    const userId = peserta[0].user_id;
    const beltAsalId = peserta[0].belt_asal_id;
    const beltTujuanId = peserta[0].belt_tujuan_id;
    const nowStr = new Date().toISOString().slice(0, 19).replace("T", " ");

    // 3. Validasi: status tidak boleh 'terdaftar' (harus sudah diinput sebelumnya)
    if (oldStatus === "terdaftar") {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message:
          "Status peserta masih 'terdaftar', gunakan endpoint submit untuk input pertama",
      });
    }

    // 4. Jika status sama, hanya update tanggal_edit
    if (status === oldStatus) {
      await conn.query(
        `UPDATE peserta_ujian SET tanggal_edit = ? WHERE id = ?`,
        [nowStr, pesertaId],
      );
      await conn.commit();

      const [updated] = await conn.query(
        `SELECT id, user_id, belt_asal_id, belt_tujuan_id, status, tanggal_lulus, tanggal_edit
         FROM peserta_ujian WHERE id = ?`,
        [pesertaId],
      );
      return res.status(200).json({
        success: true,
        message:
          "Hasil ujian berhasil diedit (status sama, hanya perbarui tanggal edit)",
        data: updated[0],
      });
    }

    // 5. Update status dan tanggal_edit (tanggal_lulus TIDAK berubah)
    await conn.query(
      `UPDATE peserta_ujian 
       SET status = ?, tanggal_edit = ?
       WHERE id = ?`,
      [status, nowStr, pesertaId],
    );

    // 6. Logika perubahan sabuk
    if (status === "lulus" && oldStatus === "tidak_lulus") {
      // Upgrade: tidak_lulus → lulus -> tambahkan sabuk baru
      const [beltTujuan] = await conn.query(
        "SELECT id FROM belts WHERE id = ?",
        [beltTujuanId],
      );
      if (beltTujuan.length === 0) {
        await conn.rollback();
        return res
          .status(400)
          .json({ success: false, message: "Belt tujuan tidak ditemukan" });
      }

      // Non-aktifkan semua sabuk user
      await conn.query(
        "UPDATE user_belts SET is_current = 0 WHERE user_id = ?",
        [userId],
      );

      // Tambahkan sabuk baru
      await conn.query(
        `INSERT INTO user_belts (user_id, belt_id, is_current, achieved_at)
         VALUES (?, ?, 1, ?)`,
        [userId, beltTujuanId, nowStr.split(" ")[0]],
      );
    } else if (status === "tidak_lulus" && oldStatus === "lulus") {
      // Downgrade: lulus → tidak_lulus -> hapus sabuk tujuan, kembalikan sabuk asal
      const [activeBeltTujuan] = await conn.query(
        `SELECT id FROM user_belts 
         WHERE user_id = ? AND belt_id = ? AND is_current = 1`,
        [userId, beltTujuanId],
      );
      if (activeBeltTujuan.length > 0) {
        await conn.query(`UPDATE user_belts SET is_current = 0 WHERE id = ?`, [
          activeBeltTujuan[0].id,
        ]);
      }

      const [asalBelt] = await conn.query(
        `SELECT id FROM user_belts 
         WHERE user_id = ? AND belt_id = ?`,
        [userId, beltAsalId],
      );
      if (asalBelt.length > 0) {
        await conn.query(`UPDATE user_belts SET is_current = 1 WHERE id = ?`, [
          asalBelt[0].id,
        ]);
      } else {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message:
            "Sabuk asal tidak ditemukan di user_belts, tidak dapat melakukan downgrade",
        });
      }
    }

    await conn.commit();

    // Ambil data terbaru
    const [updated] = await conn.query(
      `SELECT id, user_id, belt_asal_id, belt_tujuan_id, status, tanggal_lulus, tanggal_edit
       FROM peserta_ujian WHERE id = ?`,
      [pesertaId],
    );

    return res.status(200).json({
      success: true,
      message: "Hasil ujian berhasil diedit",
      data: updated[0],
    });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengedit hasil ujian",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
