const db = require("../../../config/database");

exports.updateStatusUjianOtomatis = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Cari ujian dengan status 'terjadwal' dan tanggal_selesai < hari ini
    const [ujianToUpdate] = await conn.query(
      `SELECT id, level_ujian, tanggal_mulai, tanggal_selesai
       FROM ujian_sabuk
       WHERE status = 'terjadwal' 
         AND deleted_at IS NULL
         AND tanggal_selesai < ?`,
      [todayStr]
    );

    if (ujianToUpdate.length === 0) {
      return res.status(200).json({
        message: "Tidak ada ujian yang perlu diupdate",
        updated_count: 0,
        data: [],
      });
    }

    // Update status menjadi 'selesai'
    const ids = ujianToUpdate.map(u => u.id);
    const placeholders = ids.map(() => '?').join(',');
    await conn.query(
      `UPDATE ujian_sabuk SET status = 'selesai' WHERE id IN (${placeholders})`,
      ids
    );

    return res.status(200).json({
      message: "Update status ujian selesai",
      updated_count: ujianToUpdate.length,
      data: ujianToUpdate,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal mengupdate status ujian",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};