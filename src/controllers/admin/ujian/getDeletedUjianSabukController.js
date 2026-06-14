const db = require("../../../config/database");
const ALLOWED_LIMITS = [10, 25, 50, 75, 100, 200];

exports.getDeletedUjianSabuk = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim() || null;
    const level = req.query.level || null;

    if (!ALLOWED_LIMITS.includes(limit)) limit = 10;
    if (page < 1) page = 1;
    const offset = (page - 1) * limit;

    let where = ["deleted_at IS NOT NULL"];
    let params = [];

    if (level && ["kota", "provinsi"].includes(level)) {
      where.push("level_ujian = ?");
      params.push(level);
    }
    if (search) {
      where.push("(lokasi LIKE ? OR keterangan LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = "WHERE " + where.join(" AND ");

    // Hitung total
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM ujian_sabuk ${whereClause}`,
      params,
    );
    const totalPages = Math.ceil(total / limit);

    // Ambil data
    const [rows] = await db.query(
      `SELECT id, tanggal_mulai, tanggal_selesai, level_ujian, lokasi, keterangan, status, created_at, deleted_at
       FROM ujian_sabuk
       ${whereClause}
       ORDER BY deleted_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    return res.status(200).json({
      message: "Berhasil mengambil data ujian yang telah dihapus",
      pagination: {
        current_page: page,
        per_page: limit,
        total_page: totalPages,
        total_data: total,
        has_next: page < totalPages,
        has_prev: page > 1,
      },
      data: rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal mengambil data ujian yang dihapus",
      error: error.message,
    });
  }
};
