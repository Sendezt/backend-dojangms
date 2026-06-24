const db = require("../../../config/database");

const ALLOWED_LIMITS = [10, 25, 50, 75, 100, 200];

exports.getAllKelasKyorugiSimple = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;

    if (!ALLOWED_LIMITS.includes(limit)) limit = 10;
    if (page < 1) page = 1;

    const offset = (page - 1) * limit;

    // Hitung total data
    const [[totalRow]] = await db.query(
      "SELECT COUNT(*) as total FROM kelas_kyorugi",
    );
    const totalData = totalRow.total;
    const totalPages = Math.ceil(totalData / limit);

    // Ambil data dengan pagination
    const [rows] = await db.query(
      `
      SELECT 
        ky.id,
        ky.gender,
        ky.label,
        ky.batas_bawah,
        ky.batas_atas,
        ku.id AS kategori_usia_id,
        ku.name AS kategori_usia_nama,
        ku.min_age,
        ku.max_age,
        lk.id AS level_kelas_id,
        lk.name AS level_kelas_nama
      FROM kelas_kyorugi ky
      JOIN kategori_usia ku ON ku.id = ky.kategori_usia_id
      JOIN level_kelas lk ON lk.id = ky.level_kelas_id
      ORDER BY ky.id ASC
      LIMIT ? OFFSET ?
      `,
      [limit, offset],
    );

    const data = rows.map((row) => ({
      id: row.id,
      gender: row.gender,
      label: row.label,
      batas_bawah: row.batas_bawah,
      batas_atas: row.batas_atas,
      kategori_usia: {
        id: row.kategori_usia_id,
        nama: row.kategori_usia_nama,
        min_age: row.min_age,
        max_age: row.max_age,
      },
      level_kelas: {
        id: row.level_kelas_id,
        nama: row.level_kelas_nama,
      },
    }));

    return res.status(200).json({
      success: true,
      message: data.length
        ? "Berhasil mengambil data kelas kyorugi"
        : "Data kelas kyorugi masih kosong",
      data,
      meta: {
        pagination: {
          current_page: page,
          per_page: limit,
          total_page: totalPages,
          total_data: totalData,
          has_next: page < totalPages,
          has_prev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server",
      error: error.message,
    });
  }
};
