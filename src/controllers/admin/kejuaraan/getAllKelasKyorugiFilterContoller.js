const db = require("../../../config/database");

const ALLOWED_LIMITS = [10, 25, 50, 75, 100, 200];
const ALLOWED_GENDERS = ["putra", "putri"];

exports.getAllKelasKyorugi = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim() || null;
    const gender = req.query.gender?.trim() || null;
    const kategori_usia_id = req.query.kategori_usia_id
      ? parseInt(req.query.kategori_usia_id)
      : null;
    const level_kelas_id = req.query.level_kelas_id
      ? parseInt(req.query.level_kelas_id)
      : null;

    if (!ALLOWED_LIMITS.includes(limit)) limit = 10;
    if (page < 1) page = 1;
    if (gender && !ALLOWED_GENDERS.includes(gender)) {
      return res
        .status(400)
        .json({ success: false, message: "Gender tidak valid" });
    }
    if (kategori_usia_id && (isNaN(kategori_usia_id) || kategori_usia_id < 1)) {
      return res
        .status(400)
        .json({ success: false, message: "ID kategori usia tidak valid" });
    }
    if (level_kelas_id && (isNaN(level_kelas_id) || level_kelas_id < 1)) {
      return res
        .status(400)
        .json({ success: false, message: "ID level kelas tidak valid" });
    }

    const offset = (page - 1) * limit;

    const where = [];
    const params = [];

    if (search) {
      where.push("ky.label LIKE ?");
      params.push(`%${search}%`);
    }
    if (gender) {
      where.push("ky.gender = ?");
      params.push(gender);
    }
    if (kategori_usia_id) {
      where.push("ky.kategori_usia_id = ?");
      params.push(kategori_usia_id);
    }
    if (level_kelas_id) {
      where.push("ky.level_kelas_id = ?");
      params.push(level_kelas_id);
    }

    const whereClause = where.length ? "WHERE " + where.join(" AND ") : "";

    const countSql = `SELECT COUNT(*) as total FROM kelas_kyorugi ky ${whereClause}`;
    const [countResult] = await db.query(countSql, params);
    const totalData = countResult[0]?.total || 0;
    const totalPages = Math.ceil(totalData / limit);

    const dataSql = `
      SELECT 
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
      ${whereClause}
      ORDER BY ky.id ASC
      LIMIT ? OFFSET ?
    `;
    const dataParams = [...params, limit, offset];
    const [rows] = await db.query(dataSql, dataParams);

    const data = rows.map((row) => ({
      id: row.id,
      gender: row.gender,
      label: row.label,
      batas_bawah: row.batas_bawah,
      batas_atas: row.batas_atas,
      kategori_usia: {
        id: row.kategori_usia_id,
        nama: row.kategori_usia_nama,
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
