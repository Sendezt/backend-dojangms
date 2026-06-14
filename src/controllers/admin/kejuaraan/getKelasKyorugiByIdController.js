const db = require("../../../config/database");

exports.getKelasKyorugiById = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const id = parseInt(req.params.id);
    if (!id || isNaN(id) || id < 1) {
      return res.status(400).json({ message: "ID kelas kyorugi tidak valid" });
    }

    const [rows] = await conn.query(
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
       JOIN kategori_usia ku ON ku.id = ky.kategori_usia_id
       JOIN level_kelas lk ON lk.id = ky.level_kelas_id
       WHERE ky.id = ?`,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Kelas kyorugi tidak ditemukan" });
    }

    const data = rows[0];

    const response = {
      id: data.id,
      gender: data.gender,
      label: data.label,
      batas_bawah: data.batas_bawah,
      batas_atas: data.batas_atas,
      kategori_usia: {
        id: data.kategori_usia_id,
        nama: data.kategori_usia_nama,
      },
      level_kelas: {
        id: data.level_kelas_id,
        nama: data.level_kelas_nama,
      },
    };

    return res.status(200).json({
      message: "Detail kelas kyorugi berhasil diambil",
      data: response,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal mengambil detail kelas kyorugi",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
