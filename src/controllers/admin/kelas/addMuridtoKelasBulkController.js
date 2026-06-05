const db = require("../../../config/database");

exports.bulkAddMuridToKelas = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const { kelas_id, user_ids } = req.body;

    // Validasi input
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
    // Validasi setiap user_id
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

    // Mulai transaction
    await conn.beginTransaction();

    // 1. Cek kelas aktif
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

    // 2. Ambil data murid yang valid (role murid dan status active)
    const placeholders = user_ids.map(() => "?").join(",");
    const [validMurids] = await conn.query(
      `SELECT u.id, u.name
       FROM users u
       JOIN user_roles ur ON ur.user_id = u.id
       JOIN roles r ON r.id = ur.role_id
       WHERE u.id IN (${placeholders}) 
         AND r.name = 'murid' 
         AND u.status = 'active'`,
      user_ids,
    );
    const validIds = validMurids.map((m) => m.id);
    const invalidIds = user_ids.filter((id) => !validIds.includes(id));

    if (validIds.length === 0) {
      await conn.rollback();
      return res
        .status(400)
        .json({ message: "Tidak ada murid valid yang ditemukan" });
    }

    // 3. Cek murid yang sudah terdaftar aktif di kelas ini
    const [existingActive] = await conn.query(
      `SELECT user_id FROM kelas_murid 
       WHERE kelas_id = ? AND user_id IN (${placeholders}) AND status = 'aktif'`,
      [kelas_id, ...validIds],
    );
    const alreadyActiveIds = existingActive.map((e) => e.user_id);
    const newValidIds = validIds.filter((id) => !alreadyActiveIds.includes(id));

    if (newValidIds.length === 0) {
      await conn.rollback();
      return res
        .status(409)
        .json({ message: "Semua murid sudah terdaftar aktif di kelas ini" });
    }

    // 4. Cek yang sudah punya record nonaktif (perlu diaktifkan ulang)
    const [existingInactive] = await conn.query(
      `SELECT user_id FROM kelas_murid 
       WHERE kelas_id = ? AND user_id IN (${placeholders}) AND status = 'nonaktif'`,
      [kelas_id, ...newValidIds],
    );
    const inactiveIds = existingInactive.map((e) => e.user_id);
    const freshIds = newValidIds.filter((id) => !inactiveIds.includes(id));

    // Proses update untuk yang nonaktif
    for (const uid of inactiveIds) {
      await conn.query(
        `UPDATE kelas_murid SET status = 'aktif', tanggal_bergabung = CURDATE() 
         WHERE kelas_id = ? AND user_id = ?`,
        [kelas_id, uid],
      );
    }

    // Insert untuk yang belum pernah sama sekali
    if (freshIds.length > 0) {
      const values = freshIds.map((uid) => [
        kelas_id,
        uid,
        new Date().toISOString().slice(0, 10),
        "aktif",
      ]);
      await conn.query(
        `INSERT INTO kelas_murid (kelas_id, user_id, tanggal_bergabung, status) VALUES ?`,
        [values],
      );
    }

    await conn.commit();

    // Ambil data final
    const [finalEnrollments] = await conn.query(
      `SELECT km.kelas_id, km.user_id, km.tanggal_bergabung, km.status,
              k.nama AS kelas_nama, u.name AS murid_nama
       FROM kelas_murid km
       JOIN kelas k ON k.id = km.kelas_id
       JOIN users u ON u.id = km.user_id
       WHERE km.kelas_id = ? AND km.user_id IN (${validIds.map(() => "?").join(",")})
         AND km.status = 'aktif'`,
      [kelas_id, ...validIds],
    );

    const successCount = finalEnrollments.length;
    const failedIds = user_ids.filter(
      (id) => !validIds.includes(id) || alreadyActiveIds.includes(id),
    );

    return res.status(200).json({
      message: `Berhasil menambahkan ${successCount} murid ke kelas`,
      summary: {
        total_requested: user_ids.length,
        total_success: successCount,
        total_failed: failedIds.length,
      },
      details: {
        success: finalEnrollments,
        failed: {
          invalid_murid: invalidIds,
          already_active: alreadyActiveIds,
        },
      },
    });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    return res.status(500).json({
      message: "Gagal menambahkan murid ke kelas",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
