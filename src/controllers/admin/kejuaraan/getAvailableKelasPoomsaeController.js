// src/controllers/admin/kejuaraan/getAvailableKelasPoomsaeController.js
const db = require("../../../config/database");

exports.getAvailableKelasPoomsae = async (req, res) => {
  const kejuaraanId = parseInt(req.params.kejuaraanId);
  if (isNaN(kejuaraanId) || kejuaraanId < 1) {
    return res.status(400).json({ message: "ID kejuaraan tidak valid" });
  }

  try {
    const [kejuaraan] = await db.query(
      "SELECT id FROM kejuaraan WHERE id = ?",
      [kejuaraanId],
    );
    if (kejuaraan.length === 0) {
      return res.status(404).json({ message: "Kejuaraan tidak ditemukan" });
    }

    const [rows] = await db.query(
      `SELECT 
         p.id,
         p.gender,
         pj.name AS jurus_nama,
         pf.name AS format_nama,
         ku.id AS kategori_usia_id,
         ku.name AS kategori_usia_nama,
         lk.id AS level_kelas_id,
         lk.name AS level_kelas_nama
       FROM kelas_poomsae p
       JOIN poomsae_jurus pj ON p.jurus_id = pj.id
       JOIN poomsae_format pf ON p.format_id = pf.id
       JOIN kategori_usia ku ON p.kategori_usia_id = ku.id
       JOIN level_kelas lk ON p.level_kelas_id = lk.id
       WHERE NOT EXISTS (
         SELECT 1 FROM kelas_kejuaraan kk
         WHERE kk.kejuaraan_id = ? 
           AND kk.tipe = 'poomsae' 
           AND kk.kelas_id = p.id
       )
       ORDER BY ku.name, lk.name, pj.name, pf.name, p.gender`,
      [kejuaraanId],
    );

    const data = rows.map((row) => ({
      id: row.id,
      gender: row.gender,
      jurus: { nama: row.jurus_nama },
      format: { nama: row.format_nama },
      kategori_usia: { id: row.kategori_usia_id, nama: row.kategori_usia_nama },
      level_kelas: { id: row.level_kelas_id, nama: row.level_kelas_nama },
    }));

    res.status(200).json({
      success: true,
      message: data.length
        ? "Berhasil mengambil kelas poomsae yang tersedia"
        : "Tidak ada kelas poomsae yang tersedia",
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
