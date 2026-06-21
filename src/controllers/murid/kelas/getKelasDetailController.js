const db = require("../../../config/database");
exports.getDetailKelasMurid = async (req, res) => {
  try {
    const userId = req.user.id;
    const kelasId = parseInt(req.params.kelasId);
    if (isNaN(kelasId) || kelasId < 1) {
      return res
        .status(400)
        .json({ success: false, message: "ID kelas tidak valid" });
    }

    // 1. Cek apakah murid terdaftar di kelas ini (aktif)
    const [keanggotaan] = await db.query(
      `SELECT km.id, km.tanggal_bergabung, km.status AS status_keanggotaan
       FROM kelas_murid km
       WHERE km.kelas_id = ? AND km.user_id = ? AND km.status = 'aktif'`,
      [kelasId, userId],
    );
    if (keanggotaan.length === 0) {
      return res
        .status(403)
        .json({ success: false, message: "Anda tidak terdaftar di kelas ini" });
    }

    // 2. Ambil informasi kelas
    const [kelasRows] = await db.query(
      `SELECT id, nama, deskripsi, status, created_at FROM kelas WHERE id = ?`,
      [kelasId],
    );
    if (kelasRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Kelas tidak ditemukan" });
    }
    const kelas = kelasRows[0];

    // 3. Ambil jadwal kelas (aktif)
    const [jadwalRows] = await db.query(
      `SELECT id, nama AS jadwal_nama, hari, effective_from, effective_until, 
              tanggal_mulai, tanggal_selesai, jam_mulai, jam_selesai, lokasi
       FROM jadwal 
       WHERE kelas_id = ? AND tipe = 'kelas' AND status = 'aktif'
       ORDER BY 
         COALESCE(effective_from, tanggal_mulai) ASC, 
         hari ASC, 
         jam_mulai ASC`,
      [kelasId],
    );

    // 4. Ambil riwayat absensi murid di kelas ini
    // Ambil semua absensi murid yang terkait dengan kelas ini (lewat jadwal)
    const [absensiRows] = await db.query(
      `SELECT 
         a.id AS absensi_id,
         a.tanggal,
         a.status,
         a.catatan,
         a.created_at AS waktu_absen,
         j.id AS jadwal_id,
         j.nama AS jadwal_nama,
         j.jam_mulai,
         j.jam_selesai,
         j.hari
       FROM absensi a
       JOIN jadwal j ON a.jadwal_id = j.id
       WHERE a.user_id = ? AND j.kelas_id = ?
       ORDER BY a.tanggal DESC, j.jam_mulai DESC`,
      [userId, kelasId],
    );

    // 5. Hitung statistik absensi
    let totalHadir = 0,
      totalIzin = 0,
      totalSakit = 0,
      totalAlpha = 0;
    absensiRows.forEach((a) => {
      if (a.status === "hadir") totalHadir++;
      else if (a.status === "izin") totalIzin++;
      else if (a.status === "sakit") totalSakit++;
      else if (a.status === "alpha") totalAlpha++;
    });
    const totalAbsensi = absensiRows.length;
    const persentaseKehadiran =
      totalAbsensi > 0
        ? parseFloat(((totalHadir / totalAbsensi) * 100).toFixed(2))
        : 0;

    // 6. Ambil jumlah murid aktif di kelas
    const [[muridCount]] = await db.query(
      `SELECT COUNT(*) as total FROM kelas_murid WHERE kelas_id = ? AND status = 'aktif'`,
      [kelasId],
    );
    const jumlahMurid = muridCount.total || 0;

    // 7. Ambil jumlah pelatih aktif di kelas
    const [[pelatihCount]] = await db.query(
      `SELECT COUNT(*) as total FROM kelas_pelatih WHERE kelas_id = ? AND status = 'aktif'`,
      [kelasId],
    );
    const jumlahPelatih = pelatihCount.total || 0;

    // Format response
    const response = {
      success: true,
      message: "Berhasil mengambil detail kelas",
      data: {
        kelas: {
          id: kelas.id,
          nama: kelas.nama,
          deskripsi: kelas.deskripsi,
          status: kelas.status,
          created_at: kelas.created_at,
          tanggal_bergabung: keanggotaan[0].tanggal_bergabung,
          jumlah_murid_aktif: jumlahMurid,
          jumlah_pelatih_aktif: jumlahPelatih,
        },
        jadwal: jadwalRows,
        absensi: {
          riwayat: absensiRows,
          statistik: {
            total_pertemuan: totalAbsensi,
            hadir: totalHadir,
            izin: totalIzin,
            sakit: totalSakit,
            alpha: totalAlpha,
            persentase_kehadiran: persentaseKehadiran,
          },
        },
      },
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Gagal mengambil detail kelas",
        error: error.message,
      });
  }
};
