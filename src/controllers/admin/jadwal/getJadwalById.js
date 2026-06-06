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
        j.id, j.tipe, j.nama, j.kelas_id, j.hari, j.effective_from, j.effective_until,
        j.tanggal_mulai, j.tanggal_selesai, j.jam_mulai, j.jam_selesai,
        j.lokasi, j.keterangan, j.status, j.dibuat_oleh, j.created_at, j.updated_at,
        k.nama AS kelas_nama
       FROM jadwal j
       LEFT JOIN kelas k ON j.kelas_id = k.id
       WHERE j.id = ?`,
      [id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Jadwal tidak ditemukan" });
    }

    return res.status(200).json({
      message: "Berhasil mengambil detail jadwal",
      data: rows[0],
    });
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
