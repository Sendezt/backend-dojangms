const db = require("../../../config/database");

/**
 * GET /api/murid/dashboard
 * Dashboard untuk murid yang sedang login
 */
exports.getMuridDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // ================================================================
    // 1. RINGKASAN KELAS
    // ================================================================
    const [kelasStats] = await db.query(
      `SELECT 
        COUNT(*) AS total_kelas,
        SUM(CASE WHEN k.status = 'aktif' THEN 1 ELSE 0 END) AS aktif
       FROM kelas_murid km
       JOIN kelas k ON km.kelas_id = k.id
       WHERE km.user_id = ? AND km.status = 'aktif'`,
      [userId],
    );

    // 5 kelas terakhir yang diikuti (berdasarkan tanggal bergabung)
    const [kelasTerbaru] = await db.query(
      `SELECT 
        k.id, k.nama, k.deskripsi, k.status,
        km.tanggal_bergabung,
        (SELECT COUNT(*) FROM jadwal WHERE kelas_id = k.id AND tipe = 'kelas' AND status = 'aktif') AS jadwal_aktif
       FROM kelas_murid km
       JOIN kelas k ON km.kelas_id = k.id
       WHERE km.user_id = ? AND km.status = 'aktif'
       ORDER BY km.tanggal_bergabung DESC
       LIMIT 5`,
      [userId],
    );

    // ================================================================
    // 2. STATISTIK ABSENSI
    // ================================================================
    const [absensiStats] = await db.query(
      `SELECT 
        COUNT(*) AS total_pertemuan,
        SUM(CASE WHEN status = 'hadir' THEN 1 ELSE 0 END) AS hadir,
        SUM(CASE WHEN status = 'izin' THEN 1 ELSE 0 END) AS izin,
        SUM(CASE WHEN status = 'sakit' THEN 1 ELSE 0 END) AS sakit,
        SUM(CASE WHEN status = 'alpha' THEN 1 ELSE 0 END) AS alpha
       FROM absensi
       WHERE user_id = ?`,
      [userId],
    );

    const total = absensiStats[0]?.total_pertemuan || 0;
    const hadir = absensiStats[0]?.hadir || 0;
    const izin = absensiStats[0]?.izin || 0;
    const sakit = absensiStats[0]?.sakit || 0;
    const alpha = absensiStats[0]?.alpha || 0;
    const persentase =
      total > 0 ? parseFloat(((hadir / total) * 100).toFixed(1)) : 0;

    // 5 absensi terakhir
    const [absensiTerbaru] = await db.query(
      `SELECT 
        a.tanggal, a.status, a.catatan,
        j.nama AS jadwal_nama
       FROM absensi a
       JOIN jadwal j ON a.jadwal_id = j.id
       WHERE a.user_id = ?
       ORDER BY a.tanggal DESC, a.created_at DESC
       LIMIT 5`,
      [userId],
    );

    // ================================================================
    // 3. JADWAL TERDEKAT (kelas + latihan wajib)
    // ================================================================
    // Ambil kelas yang diikuti
    const [kelasIds] = await db.query(
      `SELECT kelas_id FROM kelas_murid WHERE user_id = ? AND status = 'aktif'`,
      [userId],
    );
    const kelasIdList = kelasIds.map((k) => k.kelas_id);

    let jadwalQuery = `
      SELECT 
        j.id, j.nama AS jadwal_nama, j.tipe, j.hari,
        j.effective_from, j.effective_until,
        j.tanggal_mulai, j.tanggal_selesai,
        j.jam_mulai, j.jam_selesai, j.lokasi,
        CASE 
          WHEN j.tipe = 'kelas' THEN k.nama
          WHEN j.tipe = 'latihan_wajib' THEN 'Latihan Wajib'
          ELSE NULL
        END AS sumber_nama
      FROM jadwal j
      LEFT JOIN kelas k ON j.kelas_id = k.id
      WHERE j.status = 'aktif'
        AND (
          (j.tipe = 'kelas' AND j.kelas_id IN (?))
          OR (j.tipe = 'latihan_wajib' AND j.kelas_id IS NULL)
        )
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
    let params = [kelasIdList.length > 0 ? kelasIdList : [0]];
    const [jadwalTerdekat] = await db.query(jadwalQuery, params);

    // ================================================================
    // 4. PENGUMUMAN TERBARU (5)
    // ================================================================
    // Ambil role user
    const [roles] = await db.query(
      `SELECT r.name FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = ?`,
      [userId],
    );
    const userRoles = roles.map((r) => r.name);

    // Ambil kelas user
    const [kelasUser] = await db.query(
      `SELECT kelas_id FROM kelas_murid WHERE user_id = ? AND status = 'aktif'`,
      [userId],
    );
    const kelasUserIds = kelasUser.map((k) => k.kelas_id);

    const rolePlaceholder = userRoles.length > 0 ? userRoles : ["none"];
    const kelasPlaceholder = kelasUserIds.length > 0 ? kelasUserIds : [0];

    const [pengumuman] = await db.query(
      `SELECT 
        p.id, p.judul, p.isi, p.target_type, p.target_role,
        p.kelas_id, p.created_at, p.tanggal_publish,
        u.name AS pembuat_nama
       FROM pengumuman p
       LEFT JOIN users u ON p.dibuat_oleh = u.id
       WHERE p.status = 'terkirim'
         AND (p.tanggal_publish IS NULL OR p.tanggal_publish <= CURDATE())
         AND (
           p.target_type = 'global'
           OR (p.target_type = 'role' AND (p.target_role = 'semua' OR p.target_role IN (?)))
           OR (p.target_type = 'kelas' AND p.kelas_id IN (?))
           OR (p.target_type = 'individu' AND EXISTS (
             SELECT 1 FROM pengumuman_target_user ptu WHERE ptu.pengumuman_id = p.id AND ptu.user_id = ?
           ))
         )
       ORDER BY p.created_at DESC
       LIMIT 5`,
      [rolePlaceholder, kelasPlaceholder, userId],
    );

    // ================================================================
    // 5. PRESTASI TERBARU (5)
    // ================================================================
    const [prestasi] = await db.query(
      `SELECT 
        k.name AS kejuaraan_nama, k.level, k.year,
        pk.hasil, pk.catatan,
        kk.tipe AS cabang,
        b.name AS belt_saat_itu
       FROM peserta_kejuaraan pk
       JOIN kelas_kejuaraan kk ON pk.kelas_kejuaraan_id = kk.id
       JOIN kejuaraan k ON kk.kejuaraan_id = k.id
       JOIN belts b ON pk.belt_id = b.id
       WHERE pk.user_id = ? AND pk.hasil IS NOT NULL AND pk.hasil != 'peserta'
       ORDER BY k.end_date DESC, k.start_date DESC
       LIMIT 5`,
      [userId],
    );

    // Ringkasan prestasi
    const [prestasiStats] = await db.query(
      `SELECT 
        COUNT(*) AS total_prestasi,
        SUM(CASE WHEN hasil IN ('juara1','juara2','juara3') THEN 1 ELSE 0 END) AS total_juara
       FROM peserta_kejuaraan
       WHERE user_id = ? AND hasil IS NOT NULL AND hasil != 'peserta'`,
      [userId],
    );

    // ================================================================
    // 6. UJIAN SABUK TERBARU
    // ================================================================
    const [ujianTerbaru] = await db.query(
      `SELECT 
        pu.id, pu.status, pu.tanggal_lulus, pu.tanggal_edit,
        uj.lokasi, uj.tanggal_mulai, uj.tanggal_selesai,
        ba.name AS belt_asal,
        bt.name AS belt_tujuan
       FROM peserta_ujian pu
       JOIN ujian_sabuk uj ON pu.ujian_id = uj.id
       JOIN belts ba ON pu.belt_asal_id = ba.id
       JOIN belts bt ON pu.belt_tujuan_id = bt.id
       WHERE pu.user_id = ?
       ORDER BY uj.tanggal_mulai DESC
       LIMIT 1`,
      [userId],
    );

    const [ujianStats] = await db.query(
      `SELECT 
        COUNT(*) AS total_ujian,
        SUM(CASE WHEN status = 'lulus' THEN 1 ELSE 0 END) AS lulus,
        SUM(CASE WHEN status = 'tidak_lulus' THEN 1 ELSE 0 END) AS tidak_lulus,
        SUM(CASE WHEN status = 'terdaftar' THEN 1 ELSE 0 END) AS terdaftar
       FROM peserta_ujian
       WHERE user_id = ?`,
      [userId],
    );

    // ================================================================
    // 7. KEJUARAAN YANG AKAN DATANG (5)
    // ================================================================
    const [kejuaraanAkanDatang] = await db.query(
      `SELECT 
    k.id, 
    k.name AS kejuaraan_nama, 
    k.level, 
    k.location, 
    k.start_date, 
    k.end_date,
    DATEDIFF(k.start_date, CURDATE()) AS hari_menuju,
    GROUP_CONCAT(DISTINCT kk.tipe SEPARATOR ', ') AS cabang
   FROM kejuaraan k
   JOIN kelas_kejuaraan kk ON kk.kejuaraan_id = k.id
   JOIN peserta_kejuaraan pk ON pk.kelas_kejuaraan_id = kk.id
   WHERE pk.user_id = ? AND k.start_date > CURDATE()
   GROUP BY k.id
   ORDER BY k.start_date ASC
   LIMIT 5`,
      [userId],
    );

    // ================================================================
    // 8. UJIAN SABUK YANG AKAN DATANG (5)
    // ================================================================
    const [ujianAkanDatang] = await db.query(
      `SELECT 
        uj.id, uj.level_ujian, uj.lokasi, uj.keterangan,
        uj.tanggal_mulai, uj.tanggal_selesai,
        DATEDIFF(uj.tanggal_mulai, CURDATE()) AS hari_menuju,
        pu.status AS status_peserta,
        ba.name AS belt_asal,
        bt.name AS belt_tujuan
       FROM ujian_sabuk uj
       JOIN peserta_ujian pu ON pu.ujian_id = uj.id
       JOIN belts ba ON pu.belt_asal_id = ba.id
       JOIN belts bt ON pu.belt_tujuan_id = bt.id
       WHERE pu.user_id = ? 
         AND uj.tanggal_mulai > CURDATE() 
         AND uj.status = 'terjadwal' 
         AND uj.deleted_at IS NULL
       ORDER BY uj.tanggal_mulai ASC
       LIMIT 5`,
      [userId],
    );

    // ================================================================
    // RESPONSE
    // ================================================================
    const response = {
      success: true,
      data: {
        kelas: {
          total: kelasStats[0]?.total_kelas || 0,
          aktif: kelasStats[0]?.aktif || 0,
          terbaru: kelasTerbaru,
        },
        absensi: {
          statistik: {
            total_pertemuan: total,
            hadir,
            izin,
            sakit,
            alpha,
            persentase_kehadiran: persentase,
          },
          terbaru: absensiTerbaru,
        },
        jadwal_terdekat: jadwalTerdekat,
        pengumuman: pengumuman,
        prestasi: {
          total_prestasi: prestasiStats[0]?.total_prestasi || 0,
          total_juara: prestasiStats[0]?.total_juara || 0,
          terbaru: prestasi,
        },
        ujian: {
          statistik: {
            total: ujianStats[0]?.total_ujian || 0,
            lulus: ujianStats[0]?.lulus || 0,
            tidak_lulus: ujianStats[0]?.tidak_lulus || 0,
            terdaftar: ujianStats[0]?.terdaftar || 0,
          },
          terbaru: ujianTerbaru[0] || null,
        },
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
