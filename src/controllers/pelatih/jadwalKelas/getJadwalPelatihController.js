const db = require("../../../config/database");

exports.getJadwalPelatih = async (req, res) => {
  try {
    const pelatihId = req.user.id; // dari token JWT

    // Filter opsional
    const statusJadwal = req.query.status || null; // 'aktif' / 'nonaktif'
    const hari = req.query.hari || null;

    let whereClauses = [
      "kp.user_id = ?",
      "kp.status = 'aktif'",
      "j.tipe = 'kelas'",
      "k.status = 'aktif'",
    ];
    let params = [pelatihId];

    if (statusJadwal && ["aktif", "nonaktif"].includes(statusJadwal)) {
      whereClauses.push("j.status = ?");
      params.push(statusJadwal);
    }
    if (
      hari &&
      ["senin", "selasa", "rabu", "kamis", "jumat", "sabtu", "minggu"].includes(
        hari,
      )
    ) {
      whereClauses.push("j.hari = ?");
      params.push(hari);
    }

    const whereSQL = "WHERE " + whereClauses.join(" AND ");

    const query = `
      SELECT 
        j.id,
        j.nama AS jadwal_nama,
        j.tipe,
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
        k.id AS kelas_id,
        k.nama AS kelas_nama,
        k.status AS kelas_status
      FROM kelas_pelatih kp
      JOIN jadwal j ON j.kelas_id = kp.kelas_id
      JOIN kelas k ON k.id = j.kelas_id
      ${whereSQL}
      ORDER BY 
        COALESCE(j.tanggal_mulai, j.effective_from) DESC,
        j.hari ASC,
        j.jam_mulai ASC
    `;

    const [rows] = await db.query(query, params);

    const data = rows.map((row) => ({
      id: row.id,
      nama: row.jadwal_nama,
      tipe: row.tipe,
      hari: row.hari,
      effective_from: row.effective_from,
      effective_until: row.effective_until,
      tanggal_mulai: row.tanggal_mulai,
      tanggal_selesai: row.tanggal_selesai,
      jam_mulai: row.jam_mulai,
      jam_selesai: row.jam_selesai,
      lokasi: row.lokasi,
      keterangan: row.keterangan,
      status: row.jadwal_status,
      kelas: {
        id: row.kelas_id,
        nama: row.kelas_nama,
        status: row.kelas_status,
      },
    }));

    return res.status(200).json({
      success: true,
      message:
        data.length === 0
          ? "Anda belum memiliki jadwal kelas"
          : "Berhasil mengambil jadwal Anda",
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil jadwal",
      error: error.message,
    });
  }
};
