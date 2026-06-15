// src/controllers/admin/kejuaraan/getAvailableKelasKyorugiController.js
const db = require("../../../config/database");

exports.getAvailableKelasKyorugi = async (req, res) => {
  const kejuaraanId = parseInt(req.params.kejuaraanId);
  if (isNaN(kejuaraanId) || kejuaraanId < 1) {
    return res.status(400).json({ message: "ID kejuaraan tidak valid" });
  }

  try {
    // Cek kejuaraan ada
    const [kejuaraan] = await db.query("SELECT id FROM kejuaraan WHERE id = ?", [kejuaraanId]);
    if (kejuaraan.length === 0) {
      return res.status(404).json({ message: "Kejuaraan tidak ditemukan" });
    }

    const [rows] = await db.query(
      `SELECT 
         ky.id,
         ky.gender,
         ky.label,
         ky.batas_bawah,
         ky.batas_atas,
         ku.id AS kategori_usia_id,
         ku.name AS kategori_usia_nama,
         lk.id AS level_kelas_id,
         lk.name AS level_kelas_nama
       FROM kelas_kyorugi ky
       JOIN kategori_usia ku ON ky.kategori_usia_id = ku.id
       JOIN level_kelas lk ON ky.level_kelas_id = lk.id
       WHERE NOT EXISTS (
         SELECT 1 FROM kelas_kejuaraan kk
         WHERE kk.kejuaraan_id = ? 
           AND kk.tipe = 'kyorugi' 
           AND kk.kelas_id = ky.id
       )
       ORDER BY ku.name, lk.name, ky.label, ky.gender`,
      [kejuaraanId]
    );

    const data = rows.map(row => ({
      id: row.id,
      gender: row.gender,
      label: row.label,
      batas_bawah: row.batas_bawah,
      batas_atas: row.batas_atas,
      kategori_usia: { id: row.kategori_usia_id, nama: row.kategori_usia_nama },
      level_kelas: { id: row.level_kelas_id, nama: row.level_kelas_nama }
    }));

    res.status(200).json({
      success: true,
      message: data.length ? "Berhasil mengambil kelas kyorugi yang tersedia" : "Tidak ada kelas kyorugi yang tersedia",
      data
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};