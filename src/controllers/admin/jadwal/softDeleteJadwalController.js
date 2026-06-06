const db = require("../../../config/database");

exports.softDeleteJadwal = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id < 1) {
      return res.status(400).json({ message: "ID jadwal tidak valid" });
    }

    // Cek apakah jadwal ada
    const [jadwal] = await conn.query(
      "SELECT id, nama, status FROM jadwal WHERE id = ?",
      [id],
    );
    if (jadwal.length === 0) {
      return res.status(404).json({ message: "Jadwal tidak ditemukan" });
    }

    // Jika sudah nonaktif, beri pesan
    if (jadwal[0].status === "nonaktif") {
      return res
        .status(400)
        .json({ message: "Jadwal sudah dalam status nonaktif" });
    }

    // Soft delete: ubah status menjadi nonaktif
    await conn.query("UPDATE jadwal SET status = 'nonaktif' WHERE id = ?", [
      id,
    ]);

    // Ambil data terbaru
    const [updated] = await conn.query(
      `SELECT j.id, j.tipe, j.nama, j.kelas_id, j.hari, j.effective_from, j.effective_until,
              j.tanggal_mulai, j.tanggal_selesai, j.jam_mulai, j.jam_selesai,
              j.lokasi, j.keterangan, j.status, j.dibuat_oleh, j.created_at, j.updated_at,
              k.nama AS kelas_nama
       FROM jadwal j
       LEFT JOIN kelas k ON j.kelas_id = k.id
       WHERE j.id = ?`,
      [id],
    );

    return res.status(200).json({
      message: "Jadwal berhasil dinonaktifkan (soft delete)",
      data: updated[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal menghapus jadwal",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
