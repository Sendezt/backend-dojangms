const db = require("../../../config/database");

const ALLOWED_LIMITS = [10, 25, 50, 75, 100, 200];
const ALLOWED_STATUS = ["terjadwal", "selesai", "dibatalkan"];

exports.getAllUjian = async (req, res) => {
  try {
    // Pagination & filter
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || null; // terjadwal, selesai, dibatalkan
    const search = req.query.search?.trim() || null;
    const startDate = req.query.start_date || null;
    const endDate = req.query.end_date || null;

    if (!ALLOWED_LIMITS.includes(limit)) limit = 10;
    if (page < 1) page = 1;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let where = ["u.deleted_at IS NULL"];
    let params = [];

    if (status && ALLOWED_STATUS.includes(status)) {
      where.push("u.status = ?");
      params.push(status);
    }
    if (search) {
      where.push("(u.lokasi LIKE ? OR u.keterangan LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }
    if (startDate) {
      where.push("u.tanggal_mulai >= ?");
      params.push(startDate);
    }
    if (endDate) {
      where.push("u.tanggal_selesai <= ?");
      params.push(endDate);
    }

    const whereClause = "WHERE " + where.join(" AND ");

    // Count total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM ujian_sabuk u
      ${whereClause}
    `;
    const [[{ total }]] = await db.query(countQuery, params);
    const totalPages = Math.ceil(total / limit);

    // Ambil data ujian dengan statistik peserta
    const dataQuery = `
      SELECT
        u.id,
        u.level_ujian,
        u.lokasi,
        u.keterangan,
        u.status,
        u.tanggal_mulai,
        u.tanggal_selesai,
        u.created_at,
        COUNT(pu.id) AS total_peserta,
        SUM(CASE WHEN pu.status = 'terdaftar' THEN 1 ELSE 0 END) AS terdaftar,
        SUM(CASE WHEN pu.status = 'lulus' THEN 1 ELSE 0 END) AS lulus,
        SUM(CASE WHEN pu.status = 'tidak_lulus' THEN 1 ELSE 0 END) AS tidak_lulus,
        SUM(CASE WHEN pu.tanggal_edit IS NOT NULL THEN 1 ELSE 0 END) AS sudah_diedit
      FROM ujian_sabuk u
      LEFT JOIN peserta_ujian pu ON pu.ujian_id = u.id
      ${whereClause}
      GROUP BY u.id
      ORDER BY u.tanggal_mulai DESC
      LIMIT ? OFFSET ?
    `;
    const dataParams = [...params, limit, offset];
    const [rows] = await db.query(dataQuery, dataParams);

    const data = rows.map((row) => ({
      id: row.id,
      level_ujian: row.level_ujian,
      lokasi: row.lokasi,
      keterangan: row.keterangan,
      status: row.status,
      tanggal_mulai: row.tanggal_mulai,
      tanggal_selesai: row.tanggal_selesai,
      created_at: row.created_at,
      rekap: {
        total_peserta: row.total_peserta || 0,
        terdaftar: row.terdaftar || 0,
        lulus: row.lulus || 0,
        tidak_lulus: row.tidak_lulus || 0,
        sudah_diedit: row.sudah_diedit || 0,
        persentase_lulus:
          row.total_peserta > 0
            ? parseFloat(((row.lulus / row.total_peserta) * 100).toFixed(2))
            : 0,
      },
    }));

    return res.status(200).json({
      success: true,
      message:
        data.length === 0
          ? "Tidak ada ujian"
          : "Berhasil mengambil daftar ujian",
      data,
      pagination: {
        current_page: page,
        per_page: limit,
        total_page: totalPages,
        total_data: total,
        has_next: page < totalPages,
        has_prev: page > 1,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil daftar ujian",
      error: error.message,
    });
  }
};
