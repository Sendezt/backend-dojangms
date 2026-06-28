const db = require("../../../config/database");

/**
 * GET /api/pelatih/dashboard
 * Dashboard untuk pelatih yang sedang login
 */
exports.getPelatihDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // ================================================================
    // 1. STATISTIK KELAS
    // ================================================================
    const [kelasStats] = await db.query(
      `SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN k.status = 'aktif' THEN 1 ELSE 0 END) AS aktif,
        SUM(CASE WHEN k.status = 'nonaktif' THEN 1 ELSE 0 END) AS nonaktif
       FROM kelas_pelatih kp
       JOIN kelas k ON kp.kelas_id = k.id
       WHERE kp.user_id = ? AND kp.status = 'aktif'`,
      [userId],
    );

    // ================================================================
    // 2. STATISTIK MURID (di semua kelas yang diampu)
    // ================================================================
    const [muridStats] = await db.query(
      `SELECT 
        COUNT(DISTINCT km.user_id) AS total_murid_aktif
       FROM kelas_pelatih kp
       JOIN kelas_murid km ON km.kelas_id = kp.kelas_id
       WHERE kp.user_id = ? AND kp.status = 'aktif' AND km.status = 'aktif'`,
      [userId],
    );

    // ================================================================
    // 3. STATISTIK ABSENSI
    // ================================================================
    const today = new Date().toISOString().split("T")[0];
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
    const startOfWeekStr = startOfWeek.toISOString().split("T")[0];
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const startOfMonthStr = startOfMonth.toISOString().split("T")[0];

    // Hari ini
    const [absenToday] = await db.query(
      `SELECT 
        SUM(CASE WHEN a.status = 'hadir' THEN 1 ELSE 0 END) AS hadir,
        SUM(CASE WHEN a.status = 'izin' THEN 1 ELSE 0 END) AS izin,
        SUM(CASE WHEN a.status = 'sakit' THEN 1 ELSE 0 END) AS sakit,
        SUM(CASE WHEN a.status = 'alpha' THEN 1 ELSE 0 END) AS alpha,
        COUNT(*) AS total
       FROM absensi a
       JOIN jadwal j ON a.jadwal_id = j.id
       JOIN kelas_pelatih kp ON kp.kelas_id = j.kelas_id
       WHERE kp.user_id = ? AND kp.status = 'aktif' AND a.tanggal = ?`,
      [userId, today],
    );

    // Minggu ini
    const [absenWeek] = await db.query(
      `SELECT 
        SUM(CASE WHEN a.status = 'hadir' THEN 1 ELSE 0 END) AS hadir,
        COUNT(*) AS total
       FROM absensi a
       JOIN jadwal j ON a.jadwal_id = j.id
       JOIN kelas_pelatih kp ON kp.kelas_id = j.kelas_id
       WHERE kp.user_id = ? AND kp.status = 'aktif' AND a.tanggal BETWEEN ? AND ?`,
      [userId, startOfWeekStr, today],
    );

    // Bulan ini
    const [absenMonth] = await db.query(
      `SELECT 
        SUM(CASE WHEN a.status = 'hadir' THEN 1 ELSE 0 END) AS hadir,
        COUNT(*) AS total
       FROM absensi a
       JOIN jadwal j ON a.jadwal_id = j.id
       JOIN kelas_pelatih kp ON kp.kelas_id = j.kelas_id
       WHERE kp.user_id = ? AND kp.status = 'aktif' AND a.tanggal BETWEEN ? AND ?`,
      [userId, startOfMonthStr, today],
    );

    const hadirToday = absenToday[0]?.hadir || 0;
    const totalToday = absenToday[0]?.total || 0;
    const persentaseToday =
      totalToday > 0
        ? parseFloat(((hadirToday / totalToday) * 100).toFixed(1))
        : 0;

    // ================================================================
    // 4. JADWAL TERDEKAT (5 jadwal berikutnya)
    // ================================================================
    const [kelasIds] = await db.query(
      `SELECT kelas_id FROM kelas_pelatih WHERE user_id = ? AND status = 'aktif'`,
      [userId],
    );
    const kelasIdList = kelasIds.map((k) => k.kelas_id);

    let jadwalQuery = `
      SELECT 
        j.id, j.nama AS jadwal_nama, j.tipe, j.hari,
        j.effective_from, j.effective_until,
        j.tanggal_mulai, j.tanggal_selesai,
        j.jam_mulai, j.jam_selesai, j.lokasi,
        k.nama AS kelas_nama
      FROM jadwal j
      JOIN kelas k ON j.kelas_id = k.id
      WHERE j.status = 'aktif'
        AND j.kelas_id IN (?)
        AND (
          (j.effective_from IS NOT NULL AND j.effective_from <= CURDATE() AND (j.effective_until IS NULL OR j.effective_until >= CURDATE()))
          OR (j.tanggal_mulai IS NOT NULL AND j.tanggal_mulai <= CURDATE() AND j.tanggal_selesai >= CURDATE())
        )
      ORDER BY 
        CASE 
          WHEN j.hari IS NOT NULL THEN 
            FIELD(j.hari, 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu')
          ELSE 0
        END,
        j.jam_mulai ASC
      LIMIT 5
    `;
    const params = [kelasIdList.length > 0 ? kelasIdList : [0]];
    const [jadwalTerdekat] = await db.query(jadwalQuery, params);

    // ================================================================
    // 5. AKTIVITAS TERBARU (5)
    // ================================================================
    const [aktivitas] = await db.query(
      `(SELECT
        'murid_bergabung' AS tipe,
        CONCAT(u.name, ' bergabung ke kelas ', k.nama) AS deskripsi,
        km.tanggal_bergabung AS waktu
       FROM kelas_murid km
       JOIN users u ON km.user_id = u.id
       JOIN kelas k ON km.kelas_id = k.id
       JOIN kelas_pelatih kp ON kp.kelas_id = k.id
       WHERE kp.user_id = ? AND kp.status = 'aktif'
       ORDER BY km.tanggal_bergabung DESC
       LIMIT 3)
      UNION ALL
      (SELECT
        'absensi' AS tipe,
        CONCAT(u.name, ' ', a.status, ' pada ', a.tanggal) AS deskripsi,
        a.created_at AS waktu
       FROM absensi a
       JOIN users u ON a.user_id = u.id
       JOIN jadwal j ON a.jadwal_id = j.id
       JOIN kelas_pelatih kp ON kp.kelas_id = j.kelas_id
       WHERE kp.user_id = ? AND kp.status = 'aktif'
       ORDER BY a.created_at DESC
       LIMIT 2)
      ORDER BY waktu DESC
      LIMIT 5`,
      [userId, userId],
    );

    // ================================================================
    // 6. KEJUARAAN YANG AKAN DATANG (5)
    // ================================================================
    const [kejuaraanAkanDatang] = await db.query(
      `SELECT 
        id, name, level, location, start_date, end_date,
        DATEDIFF(start_date, CURDATE()) AS hari_menuju
       FROM kejuaraan
       WHERE start_date > CURDATE()
       ORDER BY start_date ASC
       LIMIT 5`,
    );

    // ================================================================
    // 7. UJIAN SABUK YANG AKAN DATANG (5)
    // ================================================================
    const [ujianAkanDatang] = await db.query(
      `SELECT 
        id, level_ujian, lokasi, keterangan, status,
        tanggal_mulai, tanggal_selesai,
        DATEDIFF(tanggal_mulai, CURDATE()) AS hari_menuju
       FROM ujian_sabuk
       WHERE tanggal_mulai > CURDATE() AND status = 'terjadwal' AND deleted_at IS NULL
       ORDER BY tanggal_mulai ASC
       LIMIT 5`,
    );

    // ================================================================
    // RESPONSE
    // ================================================================
    const response = {
      success: true,
      data: {
        kelas: {
          total: kelasStats[0]?.total || 0,
          aktif: kelasStats[0]?.aktif || 0,
          nonaktif: kelasStats[0]?.nonaktif || 0,
        },
        murid: {
          total_aktif: muridStats[0]?.total_murid_aktif || 0,
        },
        absensi: {
          hari_ini: {
            total: totalToday,
            hadir: hadirToday,
            izin: absenToday[0]?.izin || 0,
            sakit: absenToday[0]?.sakit || 0,
            alpha: absenToday[0]?.alpha || 0,
            persentase_hadir: persentaseToday,
          },
          minggu_ini: {
            total: absenWeek[0]?.total || 0,
            hadir: absenWeek[0]?.hadir || 0,
          },
          bulan_ini: {
            total: absenMonth[0]?.total || 0,
            hadir: absenMonth[0]?.hadir || 0,
          },
        },
        jadwal_terdekat: jadwalTerdekat,
        aktivitas_terbaru: aktivitas,
        kejuaraan_akan_datang: kejuaraanAkanDatang,
        ujian_akan_datang: ujianAkanDatang,
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
