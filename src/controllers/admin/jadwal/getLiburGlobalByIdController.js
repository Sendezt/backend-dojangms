const db = require("../../../config/database");

// Helper: konversi tanggal ke nama hari dalam bahasa Indonesia (huruf kecil)
function getHariIndonesia(tanggal) {
  const days = ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];
  return days[new Date(tanggal).getDay()];
}

exports.getLiburGlobalById = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id < 1) {
      return res.status(400).json({ message: "ID libur global tidak valid" });
    }

    // 1. Ambil data libur global
    const [globalRows] = await conn.query(
      "SELECT id, tanggal, keterangan, created_at FROM libur_global WHERE id = ?",
      [id],
    );
    if (globalRows.length === 0) {
      return res.status(404).json({ message: "Libur global tidak ditemukan" });
    }
    const libur = globalRows[0];
    const tanggalLibur = libur.tanggal;
    const hariLibur = getHariIndonesia(tanggalLibur); // 'senin', 'selasa', dll

    // 2. Ambil semua jadwal yang statusnya aktif
    const [allJadwal] = await conn.query(
      `SELECT 
         j.id, j.tipe, j.nama, j.kelas_id, j.hari, 
         j.effective_from, j.effective_until, 
         j.tanggal_mulai, j.tanggal_selesai, 
         j.jam_mulai, j.jam_selesai, j.lokasi, j.status,
         k.nama AS kelas_nama
       FROM jadwal j
       LEFT JOIN kelas k ON j.kelas_id = k.id
       WHERE j.status = 'aktif'`,
    );

    // 3. Filter jadwal yang terdampak
    const terdampak = [];
    for (const j of allJadwal) {
      let terdampakFlag = false;

      // Recurring: latihan_wajib atau kelas dengan hari tidak null
      if (
        (j.tipe === "latihan_wajib" ||
          (j.tipe === "kelas" && j.hari !== null)) &&
        j.hari
      ) {
        // Cocokkan hari
        if (j.hari.toLowerCase() === hariLibur) {
          // Cek effective_from dan effective_until
          let fromOk = true,
            untilOk = true;
          if (j.effective_from) {
            fromOk = new Date(tanggalLibur) >= new Date(j.effective_from);
          }
          if (j.effective_until) {
            untilOk = new Date(tanggalLibur) <= new Date(j.effective_until);
          }
          if (fromOk && untilOk) {
            terdampakFlag = true;
          }
        }
      }
      // One-time: training_camp atau kelas dengan hari null (pastikan punya tanggal_mulai & tanggal_selesai)
      else if (
        (j.tipe === "training_camp" ||
          (j.tipe === "kelas" && j.hari === null)) &&
        j.tanggal_mulai &&
        j.tanggal_selesai
      ) {
        const tglLibur = new Date(tanggalLibur);
        const tglMulai = new Date(j.tanggal_mulai);
        const tglSelesai = new Date(j.tanggal_selesai);
        if (tglLibur >= tglMulai && tglLibur <= tglSelesai) {
          terdampakFlag = true;
        }
      }

      if (terdampakFlag) {
        terdampak.push({
          jadwal_id: j.id,
          jadwal_nama: j.nama,
          tipe: j.tipe,
          hari: j.hari,
          jam_mulai: j.jam_mulai,
          jam_selesai: j.jam_selesai,
          lokasi: j.lokasi,
          kelas: j.kelas_id ? { id: j.kelas_id, nama: j.kelas_nama } : null,
          effective_from: j.effective_from,
          effective_until: j.effective_until,
          tanggal_mulai: j.tanggal_mulai,
          tanggal_selesai: j.tanggal_selesai,
        });
      }
    }

    // 4. Format response
    const response = {
      id: libur.id,
      tanggal: libur.tanggal,
      keterangan: libur.keterangan,
      created_at: libur.created_at,
      daftar_jadwal_terdampak: terdampak,
      total_terdampak: terdampak.length,
    };

    return res.status(200).json({
      message:
        "Berhasil mengambil detail libur global beserta jadwal terdampak",
      data: response,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal mengambil detail libur global",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
