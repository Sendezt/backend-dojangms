// src/controllers/admin/ujianSabuk/getUjianTerjadwalController.js
const db = require("../../../config/database");

exports.getUjianTerjadwal = async (req, res) => {
  try {
    // Ambil data ujian yang status = 'terjadwal' dan belum dihapus
    const [rows] = await db.query(
      `SELECT id, tanggal_mulai, tanggal_selesai, level_ujian, lokasi, keterangan
       FROM ujian_sabuk
       WHERE status = 'terjadwal' AND deleted_at IS NULL
       ORDER BY tanggal_mulai ASC`,
    );

    // Hitung summary
    const total = rows.length;
    const totalKota = rows.filter((u) => u.level_ujian === "kota").length;
    const totalProvinsi = rows.filter(
      (u) => u.level_ujian === "provinsi",
    ).length;

    return res.status(200).json({
      message: "Berhasil mengambil daftar ujian terjadwal",
      summary: {
        total,
        kota: totalKota,
        provinsi: totalProvinsi,
      },
      data: rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal mengambil daftar ujian terjadwal",
      error: error.message,
    });
  }
};
