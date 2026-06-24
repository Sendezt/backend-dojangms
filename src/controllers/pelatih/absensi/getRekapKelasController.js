// src/controllers/pelatih/riwayat/getRekapKelasController.js
const db = require("../../../config/database");

exports.getRekapAbsensiKelas = async (req, res) => {
  try {
    const pelatihId = req.user.id;
    const kelasId = parseInt(req.params.kelasId);
    const startDate = req.query.start_date || null;
    const endDate = req.query.end_date || null;

    if (!kelasId || isNaN(kelasId)) {
      return res
        .status(400)
        .json({ success: false, message: "ID kelas tidak valid" });
    }

    // Cek akses pelatih ke kelas
    const [check] = await db.query(
      `SELECT 1 FROM kelas_pelatih WHERE kelas_id = ? AND user_id = ? AND status = 'aktif'`,
      [kelasId, pelatihId],
    );
    if (check.length === 0) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Anda tidak memiliki akses ke kelas ini",
        });
    }

    // Ambil semua murid aktif di kelas
    const [students] = await db.query(
      `SELECT u.id, u.name FROM users u
       JOIN kelas_murid km ON km.user_id = u.id
       WHERE km.kelas_id = ? AND km.status = 'aktif' AND u.status = 'active'
       ORDER BY u.name ASC`,
      [kelasId],
    );

    if (students.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Belum ada murid di kelas ini",
        data: {
          kelas_id: kelasId,
          filter: { start_date: startDate, end_date: endDate },
          murid: [],
        },
      });
    }

    // Bangun filter tanggal
    let dateFilter = "";
    let params = [];
    if (startDate && endDate) {
      dateFilter = "AND a.tanggal BETWEEN ? AND ?";
      params = [startDate, endDate];
    } else if (startDate) {
      dateFilter = "AND a.tanggal >= ?";
      params = [startDate];
    } else if (endDate) {
      dateFilter = "AND a.tanggal <= ?";
      params = [endDate];
    }

    // Ambil statistik per murid
    let result = [];
    for (const student of students) {
      const query = `
        SELECT
          COUNT(*) AS total_sesi,
          SUM(CASE WHEN a.status = 'hadir' THEN 1 ELSE 0 END) AS hadir,
          SUM(CASE WHEN a.status = 'izin' THEN 1 ELSE 0 END) AS izin,
          SUM(CASE WHEN a.status = 'sakit' THEN 1 ELSE 0 END) AS sakit,
          SUM(CASE WHEN a.status = 'alpha' THEN 1 ELSE 0 END) AS alpha
        FROM absensi a
        JOIN jadwal j ON a.jadwal_id = j.id
        WHERE j.kelas_id = ? AND a.user_id = ?
          ${dateFilter}
      `;
      const [stats] = await db.query(query, [kelasId, student.id, ...params]);
      const stat = stats[0] || {
        total_sesi: 0,
        hadir: 0,
        izin: 0,
        sakit: 0,
        alpha: 0,
      };

      result.push({
        user_id: student.id,
        name: student.name,
        total_sesi: stat.total_sesi,
        hadir: stat.hadir,
        izin: stat.izin,
        sakit: stat.sakit,
        alpha: stat.alpha,
        persentase_hadir:
          stat.total_sesi > 0
            ? Math.round((stat.hadir / stat.total_sesi) * 100)
            : 0,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Rekap absensi kelas berhasil diambil",
      data: {
        kelas_id: kelasId,
        filter: { start_date: startDate, end_date: endDate },
        murid: result,
      },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Gagal mengambil rekap absensi",
        error: error.message,
      });
  }
};
