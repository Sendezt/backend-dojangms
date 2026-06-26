// src/controllers/admin/dashboardController.js
const db = require("../../../config/database");

exports.getAdminDashboard = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    const firstDayStr = firstDayOfMonth.toISOString().split("T")[0];

    // 1. Statistik User
    const [userStats] = await db.query(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) AS inactive,
        SUM(CASE WHEN r.name = 'murid' THEN 1 ELSE 0 END) AS murid,
        SUM(CASE WHEN r.name = 'pelatih' THEN 1 ELSE 0 END) AS pelatih,
        SUM(CASE WHEN r.name = 'admin' THEN 1 ELSE 0 END) AS admin
      FROM users u
      JOIN user_roles ur ON ur.user_id = u.id
      JOIN roles r ON r.id = ur.role_id
    `);

    // 2. Statistik User Baru Bulan Ini
    const [[newUsersMonth]] = await db.query(
      `SELECT COUNT(*) AS total FROM users WHERE created_at >= ?`,
      [firstDayStr],
    );

    // 3. Statistik Kelas
    const [classStats] = await db.query(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'aktif' THEN 1 ELSE 0 END) AS aktif,
        SUM(CASE WHEN status = 'nonaktif' THEN 1 ELSE 0 END) AS nonaktif
      FROM kelas
    `);

    // 4. Absensi Hari Ini
    const [attendanceToday] = await db.query(
      `SELECT
        SUM(CASE WHEN status = 'hadir' THEN 1 ELSE 0 END) AS hadir,
        SUM(CASE WHEN status = 'izin' THEN 1 ELSE 0 END) AS izin,
        SUM(CASE WHEN status = 'sakit' THEN 1 ELSE 0 END) AS sakit,
        SUM(CASE WHEN status = 'alpha' THEN 1 ELSE 0 END) AS alpha
      FROM absensi
      WHERE tanggal = ?
      `,
      [today],
    );
    const totalAbsenToday = Object.values(attendanceToday[0] || {}).reduce(
      (a, b) => a + b,
      0,
    );
    const persentaseHadir =
      totalAbsenToday > 0
        ? (((attendanceToday[0]?.hadir || 0) / totalAbsenToday) * 100).toFixed(
            1,
          )
        : 0;

    // 5. Kejuaraan (sedang berlangsung / akan datang)
    const [competitionStats] = await db.query(
      `
      SELECT
        SUM(CASE WHEN start_date <= ? AND end_date >= ? THEN 1 ELSE 0 END) AS berlangsung,
        SUM(CASE WHEN start_date > ? THEN 1 ELSE 0 END) AS akan_datang
      FROM kejuaraan
    `,
      [today, today, today],
    );

    // 6. Ujian Sabuk (akan datang / selesai bulan ini)
    const [examStats] = await db.query(
      `
      SELECT
        SUM(CASE WHEN tanggal_mulai > ? THEN 1 ELSE 0 END) AS akan_datang,
        SUM(CASE WHEN status = 'selesai' AND tanggal_selesai >= ? THEN 1 ELSE 0 END) AS selesai_bulan_ini
      FROM ujian_sabuk
      WHERE deleted_at IS NULL
    `,
      [today, firstDayStr],
    );

    // 7. Aktivitas Terbaru (gabungan absensi dan hasil ujian, limit 5)
    const [recentActivities] = await db.query(`
      (SELECT
        'absensi' AS tipe,
        CONCAT(u.name, ' ', a.status, ' pada ', a.tanggal) AS deskripsi,
        a.created_at AS waktu
      FROM absensi a
      JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 3)
      UNION ALL
      (SELECT
        'ujian' AS tipe,
        CONCAT(u.name, ' ', pu.status, ' pada ujian ', uj.lokasi) AS deskripsi,
        pu.tanggal_lulus AS waktu
      FROM peserta_ujian pu
      JOIN users u ON pu.user_id = u.id
      JOIN ujian_sabuk uj ON pu.ujian_id = uj.id
      WHERE pu.status != 'terdaftar'
      ORDER BY pu.tanggal_lulus DESC
      LIMIT 2)
      ORDER BY waktu DESC
      LIMIT 5
    `);

    // 8. Jumlah Peserta Kejuaraan Aktif
    const [[pesertaKejuaraan]] = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM peserta_kejuaraan pk
      JOIN kelas_kejuaraan kk ON pk.kelas_kejuaraan_id = kk.id
      JOIN kejuaraan k ON kk.kejuaraan_id = k.id
      WHERE k.end_date >= ?
    `,
      [today],
    );

    // 9. Total Peserta Ujian Belum Diinput
    const [[pesertaUjianBelum]] = await db.query(`
      SELECT COUNT(*) AS total
      FROM peserta_ujian
      WHERE status = 'terdaftar'
    `);

    // Susun response
    const response = {
      success: true,
      data: {
        users: {
          total: userStats[0]?.total || 0,
          active: userStats[0]?.active || 0,
          inactive: userStats[0]?.inactive || 0,
          murid: userStats[0]?.murid || 0,
          pelatih: userStats[0]?.pelatih || 0,
          admin: userStats[0]?.admin || 0,
          new_this_month: newUsersMonth.total || 0,
        },
        classes: {
          total: classStats[0]?.total || 0,
          aktif: classStats[0]?.aktif || 0,
          nonaktif: classStats[0]?.nonaktif || 0,
        },
        attendance: {
          today: {
            hadir: attendanceToday[0]?.hadir || 0,
            izin: attendanceToday[0]?.izin || 0,
            sakit: attendanceToday[0]?.sakit || 0,
            alpha: attendanceToday[0]?.alpha || 0,
          },
          total: totalAbsenToday,
          persentase_hadir: parseFloat(persentaseHadir),
        },
        competitions: {
          berlangsung: competitionStats[0]?.berlangsung || 0,
          akan_datang: competitionStats[0]?.akan_datang || 0,
          total_peserta_aktif: pesertaKejuaraan.total || 0,
        },
        belt_exams: {
          akan_datang: examStats[0]?.akan_datang || 0,
          selesai_bulan_ini: examStats[0]?.selesai_bulan_ini || 0,
          belum_diinput: pesertaUjianBelum.total || 0,
        },
        recent_activities: recentActivities,
      },
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data dashboard",
      error: error.message,
    });
  }
};
