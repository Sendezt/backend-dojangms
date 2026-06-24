const db = require("../../../config/database");

exports.bulkSoftDeletePelatihFromKelas = async (req, res) => {
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

    // Mulai transaction
    await conn.beginTransaction();

    // Cari assign aktif
    const placeholders = user_ids.map(() => "?").join(",");
    const [activeAssigns] = await conn.query(
      `SELECT kp.user_id, u.name AS pelatih_nama
       FROM kelas_pelatih kp
       JOIN users u ON u.id = kp.user_id
       WHERE kp.kelas_id = ? AND kp.user_id IN (${placeholders}) AND kp.status = 'aktif'`,
      [kelas_id, ...user_ids],
    );
    const activeUserIds = activeAssigns.map((a) => a.user_id);
    const notActiveUserIds = user_ids.filter(
      (id) => !activeUserIds.includes(id),
    );

    if (activeUserIds.length === 0) {
      await conn.rollback();
      return res.status(404).json({
        message: "Tidak ada pelatih aktif yang ditemukan di kelas ini",
      });
    }

    // Soft delete bulk
    const updatePlaceholders = activeUserIds.map(() => "?").join(",");
    await conn.query(
      `UPDATE kelas_pelatih SET status = 'nonaktif' 
       WHERE kelas_id = ? AND user_id IN (${updatePlaceholders}) AND status = 'aktif'`,
      [kelas_id, ...activeUserIds],
    );

    await conn.commit();

    // Ambil data final
    const [updatedData] = await conn.query(
      `SELECT kp.kelas_id, kp.user_id, kp.tanggal_bergabung, kp.status,
              k.nama AS kelas_nama, u.name AS pelatih_nama
       FROM kelas_pelatih kp
       JOIN kelas k ON k.id = kp.kelas_id
       JOIN users u ON u.id = kp.user_id
       WHERE kp.kelas_id = ? AND kp.user_id IN (${updatePlaceholders})`,
      [kelas_id, ...activeUserIds],
    );

    return res.status(200).json({
      message: `Berhasil menonaktifkan ${activeUserIds.length} pelatih dari kelas`,
      summary: {
        total_requested: user_ids.length,
        total_success: activeUserIds.length,
        total_failed: notActiveUserIds.length,
      },
      details: {
        success: updatedData,
        failed: {
          not_active_or_not_found: notActiveUserIds,
        },
      },
    });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    return res.status(500).json({
      message: "Gagal menonaktifkan pelatih dari kelas",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
