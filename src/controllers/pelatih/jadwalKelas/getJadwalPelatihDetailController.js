const db = require("../../../config/database");

exports.getDetailJadwalPelatih = async (req, res) => {
  try {
    const pelatihId = req.user.id;
    const jadwalId = parseInt(req.params.jadwalId);

    if (isNaN(jadwalId) || jadwalId < 1) {
      return res.status(400).json({
        success: false,
        message: "ID jadwal tidak valid",
      });
    }

    // Cek apakah jadwal ada dan pelatih mengampu kelasnya
    const [rows] = await db.query(
      `SELECT 
         j.id,
         j.tipe,
         j.nama AS jadwal_nama,
         j.hari,
         j.effective_from,
         j.effective_until,
         j.tanggal_mulai,
         j.tanggal_selesai,
         j.jam_mulai,
         j.jam_selesai,
         j.lokasi,
         j.keterangan,
         j.status AS jadwal_status,
         j.created_at,
         j.updated_at,
         k.id AS kelas_id,
         k.nama AS kelas_nama,
         k.deskripsi AS kelas_deskripsi,
         k.status AS kelas_status,
         k.created_at AS kelas_created_at,
         COUNT(DISTINCT km.user_id) AS jumlah_murid_aktif
       FROM jadwal j
       JOIN kelas k ON j.kelas_id = k.id
       JOIN kelas_pelatih kp ON kp.kelas_id = k.id
       LEFT JOIN kelas_murid km ON km.kelas_id = k.id AND km.status = 'aktif'
       WHERE j.id = ?
         AND kp.user_id = ?
         AND kp.status = 'aktif'
         AND k.status = 'aktif'
         AND j.tipe = 'kelas'
       GROUP BY j.id`,
      [jadwalId, pelatihId],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Jadwal tidak ditemukan atau Anda tidak memiliki akses",
      });
    }

    const data = rows[0];

    // Format response detail
    const response = {
      id: data.id,
      nama: data.jadwal_nama,
      tipe: data.tipe,
      hari: data.hari,
      jam_mulai: data.jam_mulai,
      jam_selesai: data.jam_selesai,
      lokasi: data.lokasi,
      keterangan: data.keterangan,
      status: data.jadwal_status,
      periode: {
        effective_from: data.effective_from,
        effective_until: data.effective_until,
        tanggal_mulai: data.tanggal_mulai,
        tanggal_selesai: data.tanggal_selesai,
      },
      kelas: {
        id: data.kelas_id,
        nama: data.kelas_nama,
        deskripsi: data.kelas_deskripsi,
        status: data.kelas_status,
        created_at: data.kelas_created_at,
        jumlah_murid_aktif: data.jumlah_murid_aktif,
      },
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    return res.status(200).json({
      success: true,
      message: "Berhasil mengambil detail jadwal",
      data: response,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil detail jadwal",
      error: error.message,
    });
  }
};
