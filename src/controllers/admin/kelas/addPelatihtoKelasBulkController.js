const db = require("../../../config/database");

exports.bulkAddPelatihToKelas = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const { kelas_id, user_ids } = req.body;

    if (!kelas_id) {
      return res.status(400).json({ message: "kelas_id wajib diisi" });
    }
    if (isNaN(kelas_id) || kelas_id < 1) {
      return res.status(400).json({ message: "kelas_id tidak valid" });
    }
    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return res
        .status(400)
        .json({ message: "user_ids harus berupa array non-kosong" });
    }
    for (const uid of user_ids) {
      if (isNaN(uid) || uid < 1) {
        return res
          .status(400)
          .json({ message: "Setiap user_id harus angka positif" });
      }
    }
    const uniqueUserIds = [...new Set(user_ids)];
    if (uniqueUserIds.length !== user_ids.length) {
      return res
        .status(400)
        .json({ message: "Terdapat duplikat user_id dalam array" });
    }

    await conn.beginTransaction();

    // Cek kelas aktif
    const [kelas] = await conn.query(
      "SELECT id, nama FROM kelas WHERE id = ? AND status = 'aktif'",
      [kelas_id],
    );
    if (kelas.length === 0) {
      await conn.rollback();
      return res
        .status(404)
        .json({ message: "Kelas tidak ditemukan atau tidak aktif" });
    }

    // Cari pelatih valid
    const placeholders = user_ids.map(() => "?").join(",");
    const [validPelatih] = await conn.query(
      `SELECT u.id, u.name
       FROM users u
       JOIN user_roles ur ON ur.user_id = u.id
       JOIN roles r ON r.id = ur.role_id
       WHERE u.id IN (${placeholders}) AND r.name = 'pelatih' AND u.status = 'active'`,
      user_ids,
    );
    const validIds = validPelatih.map((p) => p.id);
    const invalidIds = user_ids.filter((id) => !validIds.includes(id));

    if (validIds.length === 0) {
      await conn.rollback();
      return res
        .status(400)
        .json({ message: "Tidak ada pelatih valid yang ditemukan" });
    }

    // Cek existing records untuk validIds
    const [existing] = await conn.query(
      `SELECT user_id, status FROM kelas_pelatih WHERE kelas_id = ? AND user_id IN (${placeholders})`,
      [kelas_id, ...validIds],
    );
    const existingMap = {};
    for (const ex of existing) {
      existingMap[ex.user_id] = ex.status;
    }

    const toUpdate = []; // user_id yang sudah ada (aktif/nonaktif) -> akan diupdate jadi aktif
    const toInsert = []; // user_id yang belum ada

    for (const uid of validIds) {
      if (existingMap.hasOwnProperty(uid)) {
        toUpdate.push(uid);
      } else {
        toInsert.push(uid);
      }
    }

    // Update yang sudah ada (set status aktif & tanggal_bergabung)
    if (toUpdate.length > 0) {
      const updatePlaceholders = toUpdate.map(() => "?").join(",");
      await conn.query(
        `UPDATE kelas_pelatih SET status = 'aktif', tanggal_bergabung = CURDATE()
         WHERE kelas_id = ? AND user_id IN (${updatePlaceholders})`,
        [kelas_id, ...toUpdate],
      );
    }

    // Insert yang belum ada
    if (toInsert.length > 0) {
      const values = toInsert.map((uid) => [kelas_id, uid, "aktif"]);
      await conn.query(
        "INSERT INTO kelas_pelatih (kelas_id, user_id, status) VALUES ?",
        [values],
      );
    }

    await conn.commit();

    // Ambil data final (semua validIds yang sekarang status aktif)
    const [finalData] = await conn.query(
      `SELECT kp.id, kp.kelas_id, kp.user_id, kp.tanggal_bergabung, kp.status,
              k.nama AS kelas_nama, u.name AS pelatih_nama
       FROM kelas_pelatih kp
       JOIN kelas k ON k.id = kp.kelas_id
       JOIN users u ON u.id = kp.user_id
       WHERE kp.kelas_id = ? AND kp.user_id IN (${validIds.map(() => "?").join(",")})
         AND kp.status = 'aktif'`,
      [kelas_id, ...validIds],
    );

    // Hitung jumlah yang berhasil (aktif setelah proses)
    const successIds = finalData.map((d) => d.user_id);
    const failedIds = validIds.filter((id) => !successIds.includes(id));

    return res.status(200).json({
      message: `Berhasil menugaskan ${successIds.length} pelatih ke kelas`,
      summary: {
        total_requested: user_ids.length,
        total_success: successIds.length,
        total_failed: invalidIds.length + failedIds.length,
      },
      details: {
        success: finalData,
        failed: {
          invalid_pelatih: invalidIds,
          failed_to_activate: failedIds, // seharusnya tidak ada karena update selalu berhasil
        },
      },
    });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    return res.status(500).json({
      message: "Gagal menugaskan pelatih ke kelas",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
