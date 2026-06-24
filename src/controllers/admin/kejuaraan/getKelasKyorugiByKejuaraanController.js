// src/controllers/admin/kejuaraan/getKelasKyorugiByKejuaraanController.js
const db = require("../../../config/database");

exports.getKelasKyorugiByKejuaraan = async (req, res) => {
  const kejuaraanId = parseInt(req.params.kejuaraanId);
  if (isNaN(kejuaraanId) || kejuaraanId < 1) {
    return res.status(400).json({ message: "ID kejuaraan tidak valid" });
  }

  try {
    // Cek kejuaraan ada
    const [kejuaraan] = await db.query(
      "SELECT id FROM kejuaraan WHERE id = ?",
      [kejuaraanId],
    );
    if (kejuaraan.length === 0) {
      return res.status(404).json({ message: "Kejuaraan tidak ditemukan" });
    }

    const [rows] = await db.query(
      `SELECT 
         kk.id AS kelas_kejuaraan_id,
         ky.id AS kelas_id,
         ky.gender,
         ky.label,
         ky.batas_bawah,
         ky.batas_atas,
         ku.id AS kategori_usia_id,
         ku.name AS kategori_usia_nama,
         lk.id AS level_kelas_id,
         lk.name AS level_kelas_nama
       FROM kelas_kejuaraan kk
       JOIN kelas_kyorugi ky ON kk.kelas_id = ky.id
       JOIN kategori_usia ku ON ky.kategori_usia_id = ku.id
       JOIN level_kelas lk ON ky.level_kelas_id = lk.id
       WHERE kk.kejuaraan_id = ? AND kk.tipe = 'kyorugi'
       ORDER BY ku.name, lk.name, ky.label, ky.gender`,
      [kejuaraanId],
    );

    const data = rows.map((row) => ({
      kelas_kejuaraan_id: row.kelas_kejuaraan_id,
      kelas_id: row.kelas_id,
      gender: row.gender,
      label: row.label,
      batas_bawah: row.batas_bawah,
      batas_atas: row.batas_atas,
      kategori_usia: { id: row.kategori_usia_id, nama: row.kategori_usia_nama },
      level_kelas: { id: row.level_kelas_id, nama: row.level_kelas_nama },
    }));

    res.status(200).json({
      success: true,
      message: data.length
        ? "Berhasil mengambil kelas kyorugi di kejuaraan"
        : "Belum ada kelas kyorugi di kejuaraan ini",
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
