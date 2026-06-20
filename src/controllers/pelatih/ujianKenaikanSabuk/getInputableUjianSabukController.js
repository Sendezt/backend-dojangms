const db = require("../../../config/database");

exports.getInputableUjian = async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id,
        u.level_ujian,
        u.lokasi,
        u.keterangan,
        u.status,
        u.tanggal_mulai,
        u.tanggal_selesai,
        u.created_at,
        DATE_ADD(u.tanggal_selesai, INTERVAL 1 MONTH) AS batas_input,
        COUNT(pu.id) AS total_peserta,
        SUM(CASE WHEN pu.status = 'terdaftar' THEN 1 ELSE 0 END) AS peserta_belum_diinput
      FROM ujian_sabuk u
      LEFT JOIN peserta_ujian pu ON pu.ujian_id = u.id
      WHERE u.deleted_at IS NULL
        AND u.status != 'dibatalkan'
        AND DATE_ADD(u.tanggal_selesai, INTERVAL 1 DAY) <= CURDATE()
        AND DATE_ADD(u.tanggal_selesai, INTERVAL 1 MONTH) >= CURDATE()
      GROUP BY u.id
      HAVING peserta_belum_diinput > 0
      ORDER BY u.tanggal_mulai DESC
    `;
    const [rows] = await db.query(query);

    return res.status(200).json({
      success: true,
      message:
        rows.length === 0
          ? "Tidak ada ujian yang dapat diinput"
          : "Berhasil mengambil daftar ujian",
      data: rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil daftar ujian",
      error: error.message,
    });
  }
};
