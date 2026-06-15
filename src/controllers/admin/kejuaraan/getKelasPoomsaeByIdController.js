// src/controllers/admin/kejuaraan/getKelasPoomsaeByIdController.js
const db = require("../../../config/database");

exports.getKelasPoomsaeById = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id < 1) return res.status(400).json({ message: "ID tidak valid" });

    const [rows] = await conn.query(
      `SELECT 
         kp.id, kp.gender,
         kp.kategori_usia_id, ku.name AS kategori_usia_nama,
         kp.level_kelas_id, lk.name AS level_kelas_nama,
         kp.jurus_id, pj.name AS jurus_nama,
         kp.format_id, pf.name AS format_nama
       FROM kelas_poomsae kp
       JOIN kategori_usia ku ON ku.id = kp.kategori_usia_id
       JOIN level_kelas lk ON lk.id = kp.level_kelas_id
       JOIN poomsae_jurus pj ON pj.id = kp.jurus_id
       JOIN poomsae_format pf ON pf.id = kp.format_id
       WHERE kp.id = ?`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Kelas poomsae tidak ditemukan" });
    const row = rows[0];
    const data = {
      id: row.id,
      gender: row.gender,
      kategori_usia: { id: row.kategori_usia_id, nama: row.kategori_usia_nama },
      level_kelas: { id: row.level_kelas_id, nama: row.level_kelas_nama },
      jurus: { id: row.jurus_id, nama: row.jurus_nama },
      format: { id: row.format_id, nama: row.format_nama }
    };
    res.status(200).json({ message: "Detail kelas poomsae", data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil detail", error: error.message });
  } finally {
    conn.release();
  }
};