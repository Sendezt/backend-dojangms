const db = require("../../../config/database");

exports.getJadwalById = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id < 1) {
      return res.status(400).json({ message: "ID jadwal tidak valid" });
    }

    const [rows] = await conn.query(
      `SELECT 
        j.id,
        j.tipe,
        j.nama,
        j.status,
        j.keterangan,
        j.hari,
        j.jam_mulai,
        j.jam_selesai,
        j.effective_from,
        j.effective_until,
        j.tanggal_mulai,
        j.tanggal_selesai,
        j.lokasi,
        j.kelas_id,
        j.dibuat_oleh,
        j.created_at,
        j.updated_at,
        k.nama AS kelas_nama,
        u.name AS dibuat_oleh_nama
       FROM jadwal j
       LEFT JOIN kelas k ON j.kelas_id = k.id
       LEFT JOIN users u ON j.dibuat_oleh = u.id
       WHERE j.id = ?`,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Jadwal tidak ditemukan" });
    }

    const row = rows[0];

    // Struktur response
    const response = {
      message: "Berhasil mengambil detail jadwal",
      data: {
        id: row.id,
        informasi: {
          nama: row.nama,
          tipe: row.tipe,
          status: row.status,
          keterangan: row.keterangan,
        },
        jadwal: {
          hari: row.hari,
          jam_mulai: row.jam_mulai,
          jam_selesai: row.jam_selesai,
        },
        periode: {
          effective_from: row.effective_from,
          effective_until: row.effective_until,
          tanggal_mulai: row.tanggal_mulai,
          tanggal_selesai: row.tanggal_selesai,
        },
        lokasi: {
          nama: row.lokasi,
        },
        relasi: {
          kelas: row.kelas_id
            ? { id: row.kelas_id, nama: row.kelas_nama }
            : null,
          dibuat_oleh: row.dibuat_oleh
            ? { id: row.dibuat_oleh, nama: row.dibuat_oleh_nama }
            : null,
        },
        metadata: {
          created_at: row.created_at,
          updated_at: row.updated_at,
        },
      },
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal mengambil detail jadwal",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
