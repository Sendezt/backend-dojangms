// src/controllers/admin/ujianSabuk/getPesertaUjianByUjianIdController.js
const db = require("../../../config/database");
const ALLOWED_LIMITS = [10, 25, 50, 75, 100, 200];

exports.getPesertaUjianByUjianId = async (req, res) => {
  try {
    const ujianId = parseInt(req.params.ujianId);
    if (isNaN(ujianId) || ujianId < 1) {
      return res.status(400).json({ message: "ID ujian tidak valid" });
    }

    // Cek apakah ujian ada dan belum dihapus
    const [ujian] = await db.query(
      "SELECT id FROM ujian_sabuk WHERE id = ? AND deleted_at IS NULL",
      [ujianId],
    );
    if (ujian.length === 0) {
      return res
        .status(404)
        .json({ message: "Ujian tidak ditemukan atau sudah dihapus" });
    }

    // Pagination
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim() || null;

    if (!ALLOWED_LIMITS.includes(limit)) limit = 10;
    if (page < 1) page = 1;
    const offset = (page - 1) * limit;

    // WHERE clause: hanya status 'terdaftar'
    let where = ["pu.ujian_id = ?", "pu.status = 'terdaftar'"];
    let params = [ujianId];

    if (search) {
      where.push("(u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = "WHERE " + where.join(" AND ");

    // Hitung total data (hanya 'terdaftar')
    const countQuery = `
      SELECT COUNT(*) as total
      FROM peserta_ujian pu
      JOIN users u ON pu.user_id = u.id
      ${whereClause}
    `;
    const [[{ total }]] = await db.query(countQuery, params);
    const totalPages = Math.ceil(total / limit);

    // Ambil data peserta
    const dataQuery = `
      SELECT 
        pu.id,
        pu.user_id,
        pu.belt_asal_id,
        pu.belt_tujuan_id,
        pu.status,
        pu.tanggal_lulus,
        pu.tanggal_edit,
        u.name AS murid_nama,
        u.email AS murid_email,
        u.phone AS murid_telepon,
        ba.name AS belt_asal_nama,
        bt.name AS belt_tujuan_nama
      FROM peserta_ujian pu
      JOIN users u ON pu.user_id = u.id
      JOIN belts ba ON pu.belt_asal_id = ba.id
      JOIN belts bt ON pu.belt_tujuan_id = bt.id
      ${whereClause}
      ORDER BY u.name ASC
      LIMIT ? OFFSET ?
    `;
    const dataParams = [...params, limit, offset];
    const [rows] = await db.query(dataQuery, dataParams);

    const data = rows.map((p) => ({
      id: p.id,
      murid: {
        id: p.user_id,
        nama: p.murid_nama,
        email: p.murid_email,
        telepon: p.murid_telepon,
      },
      belt_asal: {
        id: p.belt_asal_id,
        nama: p.belt_asal_nama,
      },
      belt_tujuan: {
        id: p.belt_tujuan_id,
        nama: p.belt_tujuan_nama,
      },
      status: p.status,
      tanggal_lulus: p.tanggal_lulus,
      tanggal_edit: p.tanggal_edit,
    }));

    return res.status(200).json({
      message: "Berhasil mengambil daftar peserta ujian (status terdaftar)",
      pagination: {
        current_page: page,
        per_page: limit,
        total_page: totalPages,
        total_data: total,
        has_next: page < totalPages,
        has_prev: page > 1,
      },
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal mengambil peserta ujian",
      error: error.message,
    });
  }
};
