const db = require("../../../config/database");

exports.updateAbsensi = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const id = parseInt(req.params.id);
    const { status, catatan } = req.body;

    if (isNaN(id) || id < 1) {
      return res.status(400).json({ message: "ID absensi tidak valid" });
    }

    // Cari data absensi
    const [rows] = await conn.query(
      "SELECT id, tanggal FROM absensi WHERE id = ?",
      [id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Absensi tidak ditemukan" });
    }
    const absensi = rows[0];

    // Validasi umur data (hanya boleh update jika tanggal dalam 7 hari terakhir)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const absenDate = new Date(absensi.tanggal);
    const diffDays = (today - absenDate) / (1000 * 60 * 60 * 24);
    if (diffDays > 7) {
      return res.status(400).json({
        message: "Tidak dapat mengubah absensi yang berusia lebih dari 7 hari",
      });
    }

    // Validasi status
    if (status && !["hadir", "izin", "sakit", "alpha"].includes(status)) {
      return res.status(400).json({ message: "Status tidak valid" });
    }

    // Update
    let updateQuery = "UPDATE absensi SET ";
    const updateValues = [];
    if (status) {
      updateQuery += "status = ?, ";
      updateValues.push(status);
    }
    if (catatan !== undefined) {
      updateQuery += "catatan = ?, ";
      updateValues.push(catatan || null);
    }
    if (updateValues.length === 0) {
      return res.status(400).json({ message: "Tidak ada data yang diubah" });
    }
    updateQuery = updateQuery.slice(0, -2) + " WHERE id = ?";
    updateValues.push(id);
    await conn.query(updateQuery, updateValues);

    // Ambil data terbaru
    const [updated] = await conn.query(
      `SELECT a.id, a.kelas_id, a.jadwal_id, a.user_id, a.tanggal, a.status, a.catatan, a.dicatat_oleh, a.created_at,
              k.nama AS kelas_nama, u.name AS murid_nama
       FROM absensi a
       LEFT JOIN kelas k ON k.id = a.kelas_id
       LEFT JOIN users u ON u.id = a.user_id
       WHERE a.id = ?`,
      [id],
    );

    return res.status(200).json({
      message: "Absensi berhasil diperbarui",
      data: updated[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal memperbarui absensi",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
