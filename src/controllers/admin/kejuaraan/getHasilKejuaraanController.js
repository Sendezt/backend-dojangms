// src/controllers/admin/prestasi/getHasilKejuaraanController.js
const db = require("../../../config/database");

exports.getHasilKejuaraan = async (req, res) => {
  const kejuaraanId = parseInt(req.params.kejuaraanId);
  if (isNaN(kejuaraanId) || kejuaraanId < 1) {
    return res.status(400).json({ message: "ID kejuaraan tidak valid" });
  }

  try {
    // Cek kejuaraan ada
    const [kejuaraan] = await db.query(
      "SELECT id, name, level, location, start_date, end_date FROM kejuaraan WHERE id = ?",
      [kejuaraanId],
    );
    if (kejuaraan.length === 0) {
      return res.status(404).json({ message: "Kejuaraan tidak ditemukan" });
    }

    // 1. Total medali
    const [medaliTotal] = await db.query(
      `SELECT 
         COUNT(CASE WHEN pk.hasil = 'juara1' THEN 1 END) AS emas,
         COUNT(CASE WHEN pk.hasil = 'juara2' THEN 1 END) AS perak,
         COUNT(CASE WHEN pk.hasil = 'juara3' THEN 1 END) AS perunggu,
         COUNT(CASE WHEN pk.hasil IN ('harapan1', 'harapan2') THEN 1 END) AS harapan,
         COUNT(*) AS total_peserta
       FROM peserta_kejuaraan pk
       JOIN kelas_kejuaraan kk ON pk.kelas_kejuaraan_id = kk.id
       WHERE kk.kejuaraan_id = ?`,
      [kejuaraanId],
    );

    // 2. Daftar peraih medali (juara1, juara2, juara3, harapan1, harapan2) dengan detail kelas
    const [peraihMedali] = await db.query(
      `SELECT 
         u.id AS user_id,
         u.name,
         u.email,
         u.phone,
         pk.hasil,
         pk.belt_id,
         b.name AS belt_name,
         kk.tipe,
         CASE 
           WHEN kk.tipe = 'kyorugi' THEN (
             SELECT CONCAT(ky.label, ' ', ky.gender, ' - ', ku.name, ' ', lk.name)
             FROM kelas_kyorugi ky
             JOIN kategori_usia ku ON ky.kategori_usia_id = ku.id
             JOIN level_kelas lk ON ky.level_kelas_id = lk.id
             WHERE ky.id = kk.kelas_id
           )
           WHEN kk.tipe = 'poomsae' THEN (
             SELECT CONCAT(pj.name, ' ', pf.name, ' - ', ku.name, ' ', lk.name)
             FROM kelas_poomsae p
             JOIN poomsae_jurus pj ON p.jurus_id = pj.id
             JOIN poomsae_format pf ON p.format_id = pf.id
             JOIN kategori_usia ku ON p.kategori_usia_id = ku.id
             JOIN level_kelas lk ON p.level_kelas_id = lk.id
             WHERE p.id = kk.kelas_id
           )
         END AS nama_kelas
       FROM peserta_kejuaraan pk
       JOIN users u ON pk.user_id = u.id
       JOIN kelas_kejuaraan kk ON pk.kelas_kejuaraan_id = kk.id
       LEFT JOIN belts b ON pk.belt_id = b.id
       WHERE kk.kejuaraan_id = ?
         AND pk.hasil IN ('juara1', 'juara2', 'juara3', 'harapan1', 'harapan2')
       ORDER BY 
         FIELD(pk.hasil, 'juara1', 'juara2', 'juara3', 'harapan1', 'harapan2'),
         u.name ASC`,
      [kejuaraanId],
    );

    // 3. Daftar semua peserta (tanpa detail medali, hanya nama & hasil) untuk keperluan daftar lengkap
    const [semuaPeserta] = await db.query(
      `SELECT 
         u.id AS user_id,
         u.name,
         pk.hasil,
         CASE 
           WHEN kk.tipe = 'kyorugi' THEN (
             SELECT CONCAT(ky.label, ' ', ky.gender, ' - ', ku.name, ' ', lk.name)
             FROM kelas_kyorugi ky
             JOIN kategori_usia ku ON ky.kategori_usia_id = ku.id
             JOIN level_kelas lk ON ky.level_kelas_id = lk.id
             WHERE ky.id = kk.kelas_id
           )
           WHEN kk.tipe = 'poomsae' THEN (
             SELECT CONCAT(pj.name, ' ', pf.name, ' - ', ku.name, ' ', lk.name)
             FROM kelas_poomsae p
             JOIN poomsae_jurus pj ON p.jurus_id = pj.id
             JOIN poomsae_format pf ON p.format_id = pf.id
             JOIN kategori_usia ku ON p.kategori_usia_id = ku.id
             JOIN level_kelas lk ON p.level_kelas_id = lk.id
             WHERE p.id = kk.kelas_id
           )
         END AS nama_kelas
       FROM peserta_kejuaraan pk
       JOIN users u ON pk.user_id = u.id
       JOIN kelas_kejuaraan kk ON pk.kelas_kejuaraan_id = kk.id
       WHERE kk.kejuaraan_id = ?
       ORDER BY pk.hasil, u.name ASC`,
      [kejuaraanId],
    );

    return res.status(200).json({
      success: true,
      data: {
        kejuaraan: kejuaraan[0],
        total_medali: medaliTotal[0],
        peraih_medali: peraihMedali.map((p) => ({
          user_id: p.user_id,
          name: p.name,
          email: p.email,
          phone: p.phone,
          hasil: p.hasil,
          belt: p.belt_id ? { id: p.belt_id, nama: p.belt_name } : null,
          kelas: {
            tipe: p.tipe,
            nama: p.nama_kelas,
          },
        })),
        semua_peserta: semuaPeserta.map((p) => ({
          user_id: p.user_id,
          name: p.name,
          hasil: p.hasil,
          kelas: p.nama_kelas,
        })),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
