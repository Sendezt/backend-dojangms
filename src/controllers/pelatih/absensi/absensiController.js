const db = require("../../../config/database");

const STATUS_ABSENSI = ["hadir", "izin", "sakit", "alpha"];

// Helper: konversi Date ke nama hari Indonesia (lowercase)
function getHariIndonesia(date) {
  const days = ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];
  return days[date.getDay()];
}

// Helper: validasi waktu sekarang terhadap jam latihan (dengan toleransi)
function validateWaktuSekarang(jamMulai, jamSelesai, toleransiMenit = 15) {
  const now = new Date();
  // Buat objek Date untuk jam mulai dan selesai pada hari ini
  const [startHour, startMinute] = jamMulai.split(":").map(Number);
  const [endHour, endMinute] = jamSelesai.split(":").map(Number);

  const startTime = new Date(now);
  startTime.setHours(startHour, startMinute, 0, 0);

  const endTime = new Date(now);
  endTime.setHours(endHour, endMinute, 0, 0);

  // Batas awal: startTime - toleransi (dalam menit)
  const startLimit = new Date(startTime.getTime() - toleransiMenit * 60000);
  // Batas akhir: endTime + toleransi
  const endLimit = new Date(endTime.getTime() + toleransiMenit * 60000);

  return now >= startLimit && now <= endLimit;
}

/**
 * GET /api/pelatih/absensi/:jadwalId
 * Query: ?tanggal=YYYY-MM-DD
 */
exports.getAbsensiForm = async (req, res) => {
  try {
    const pelatihId = req.user.id;
    const jadwalId = parseInt(req.params.jadwalId);
    const tanggal = req.query.tanggal;

    if (isNaN(jadwalId) || jadwalId < 1) {
      return res
        .status(400)
        .json({ success: false, message: "ID jadwal tidak valid" });
    }
    if (!tanggal || isNaN(Date.parse(tanggal))) {
      return res.status(400).json({
        success: false,
        message: "Parameter tanggal wajib dan format YYYY-MM-DD",
      });
    }

    // Ambil data jadwal (termasuk jam_mulai & jam_selesai)
    const [jadwalCheck] = await db.query(
      `SELECT j.id, j.kelas_id, j.nama AS jadwal_nama, j.hari, 
              j.effective_from, j.effective_until, j.tanggal_mulai, j.tanggal_selesai,
              j.jam_mulai, j.jam_selesai
       FROM jadwal j
       JOIN kelas_pelatih kp ON kp.kelas_id = j.kelas_id
       WHERE j.id = ? AND kp.user_id = ? AND kp.status = 'aktif' AND j.tipe = 'kelas'`,
      [jadwalId, pelatihId],
    );
    if (jadwalCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Jadwal tidak ditemukan atau Anda tidak memiliki akses",
      });
    }
    const jadwal = jadwalCheck[0];
    const tgl = new Date(tanggal);

    // Validasi tanggal (hari & rentang)
    const validasi = await validateJadwalTanggal(jadwal, tgl);
    if (!validasi.valid) {
      return res
        .status(400)
        .json({ success: false, message: validasi.message });
    }

    const kelasId = jadwal.kelas_id;

    // Ambil semua murid aktif di kelas
    const [students] = await db.query(
      `SELECT u.id, u.name, u.email, u.phone
       FROM kelas_murid km
       JOIN users u ON km.user_id = u.id
       WHERE km.kelas_id = ? AND km.status = 'aktif' AND u.status = 'active'
       ORDER BY u.name ASC`,
      [kelasId],
    );

    // Ambil absensi yang sudah ada
    const [existingAbsensi] = await db.query(
      `SELECT user_id, status, catatan
       FROM absensi
       WHERE jadwal_id = ? AND tanggal = ?`,
      [jadwalId, tanggal],
    );
    const absensiMap = {};
    existingAbsensi.forEach((a) => {
      absensiMap[a.user_id] = { status: a.status, catatan: a.catatan };
    });

    const data = students.map((s) => ({
      user_id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      status: absensiMap[s.id]?.status || null,
      catatan: absensiMap[s.id]?.catatan || null,
    }));

    return res.status(200).json({
      success: true,
      message: "Berhasil mengambil daftar absensi",
      data: {
        jadwal_id: jadwalId,
        jadwal_nama: jadwal.jadwal_nama,
        tanggal: tanggal,
        jam_mulai: jadwal.jam_mulai,
        jam_selesai: jadwal.jam_selesai,
        murid: data,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data absensi",
      error: error.message,
    });
  }
};

/**
 * POST /api/pelatih/absensi
 * Menyimpan atau memperbarui absensi, dengan batas edit maksimal 7 hari dari tanggal latihan
 */
exports.submitAbsensi = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const pelatihId = req.user.id;
    const { jadwal_id, tanggal, daftar_absensi } = req.body;

    if (!jadwal_id || isNaN(jadwal_id) || jadwal_id < 1) {
      return res
        .status(400)
        .json({ success: false, message: "jadwal_id tidak valid" });
    }
    if (!tanggal || isNaN(Date.parse(tanggal))) {
      return res
        .status(400)
        .json({ success: false, message: "tanggal harus format YYYY-MM-DD" });
    }
    if (!Array.isArray(daftar_absensi) || daftar_absensi.length === 0) {
      return res.status(400).json({
        success: false,
        message: "daftar_absensi harus array tidak kosong",
      });
    }

    // Cek jadwal & akses pelatih
    const [jadwalCheck] = await conn.query(
      `SELECT j.id, j.kelas_id, j.nama AS jadwal_nama, j.hari, 
              j.effective_from, j.effective_until, j.tanggal_mulai, j.tanggal_selesai,
              j.jam_mulai, j.jam_selesai
       FROM jadwal j
       JOIN kelas_pelatih kp ON kp.kelas_id = j.kelas_id
       WHERE j.id = ? AND kp.user_id = ? AND kp.status = 'aktif' AND j.tipe = 'kelas'`,
      [jadwal_id, pelatihId],
    );
    if (jadwalCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Jadwal tidak ditemukan atau akses ditolak",
      });
    }
    const jadwal = jadwalCheck[0];
    const kelasId = jadwal.kelas_id;
    const tgl = new Date(tanggal);

    // Validasi tanggal (hari & rentang)
    const validasi = await validateJadwalTanggal(jadwal, tgl);
    if (!validasi.valid) {
      return res
        .status(400)
        .json({ success: false, message: validasi.message });
    }

    // Validasi jam sekarang (opsional, bisa dihapus jika tidak perlu)
    const isValidWaktu = validateWaktuSekarang(
      jadwal.jam_mulai,
      jadwal.jam_selesai,
      15,
    );
    if (!isValidWaktu) {
      return res.status(400).json({
        success: false,
        message: `Absensi hanya dapat dilakukan dalam rentang 15 menit sebelum jam ${jadwal.jam_mulai} sampai 15 menit setelah jam ${jadwal.jam_selesai}`,
      });
    }

    // ===== VALIDASI BATAS EDIT 7 HARI =====
    const now = new Date();
    const diffTime = now - tgl;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    if (diffDays > 7) {
      return res.status(403).json({
        success: false,
        message: `Tidak dapat mengelola absensi karena tanggal ${tanggal} sudah melewati batas 7 hari yang lalu`,
      });
    }

    // Mulai transaksi
    await conn.beginTransaction();

    for (const item of daftar_absensi) {
      const { user_id, status, catatan } = item;
      if (!user_id || isNaN(user_id) || user_id < 1) {
        await conn.rollback();
        return res
          .status(400)
          .json({ success: false, message: "user_id tidak valid" });
      }
      if (!STATUS_ABSENSI.includes(status)) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: `Status harus salah satu: ${STATUS_ABSENSI.join(", ")}`,
        });
      }

      // Cek murid aktif di kelas
      const [studentCheck] = await conn.query(
        `SELECT 1 FROM kelas_murid km
         JOIN users u ON km.user_id = u.id
         WHERE km.kelas_id = ? AND km.user_id = ? AND km.status = 'aktif' AND u.status = 'active'`,
        [kelasId, user_id],
      );
      if (studentCheck.length === 0) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: `User ${user_id} bukan murid aktif di kelas ini`,
        });
      }

      // Upsert absensi
      const [existing] = await conn.query(
        `SELECT id FROM absensi WHERE jadwal_id = ? AND user_id = ? AND tanggal = ?`,
        [jadwal_id, user_id, tanggal],
      );

      const catatanValue =
        catatan && typeof catatan === "string" ? catatan.trim() : null;

      if (existing.length > 0) {
        // Update - validasi tambahan: cek apakah tanggal absensi sudah lewat 7 hari (sudah dicek di atas, tapi tetap aman)
        await conn.query(
          `UPDATE absensi SET status = ?, catatan = ?, dicatat_oleh = ? WHERE id = ?`,
          [status, catatanValue, pelatihId, existing[0].id],
        );
      } else {
        // Insert baru
        await conn.query(
          `INSERT INTO absensi (kelas_id, jadwal_id, user_id, tanggal, status, catatan, dicatat_oleh)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            kelasId,
            jadwal_id,
            user_id,
            tanggal,
            status,
            catatanValue,
            pelatihId,
          ],
        );
      }
    }

    await conn.commit();

    return res.status(200).json({
      success: true,
      message: "Absensi berhasil disimpan",
      data: {
        jadwal_id,
        tanggal,
        jumlah_murid: daftar_absensi.length,
      },
    });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal menyimpan absensi",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};

// ===== Helper validasi =====
async function validateJadwalTanggal(jadwal, tgl) {
  // 1. Jika jadwal memiliki hari (recurring)
  if (jadwal.hari) {
    const hariNama = getHariIndonesia(tgl);
    if (hariNama !== jadwal.hari) {
      return {
        valid: false,
        message: `Jadwal ini hanya pada hari ${jadwal.hari}, sedangkan tanggal yang dipilih adalah ${hariNama}`,
      };
    }
    if (jadwal.effective_from && tgl < new Date(jadwal.effective_from)) {
      return {
        valid: false,
        message: `Jadwal ini berlaku mulai ${jadwal.effective_from}`,
      };
    }
    if (jadwal.effective_until && tgl > new Date(jadwal.effective_until)) {
      return {
        valid: false,
        message: `Jadwal ini hanya berlaku sampai ${jadwal.effective_until}`,
      };
    }
    return { valid: true };
  }

  // 2. One-time (training camp atau kelas one-time)
  if (jadwal.tanggal_mulai && tgl < new Date(jadwal.tanggal_mulai)) {
    return {
      valid: false,
      message: `Jadwal ini dimulai pada ${jadwal.tanggal_mulai}`,
    };
  }
  if (jadwal.tanggal_selesai && tgl > new Date(jadwal.tanggal_selesai)) {
    return {
      valid: false,
      message: `Jadwal ini berakhir pada ${jadwal.tanggal_selesai}`,
    };
  }
  return { valid: true };
}
