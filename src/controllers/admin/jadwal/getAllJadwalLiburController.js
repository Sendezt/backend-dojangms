const db = require("../../../config/database");

exports.getAllLibur = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const allowedLimits = [10, 25, 50, 75, 100, 200];
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const jadwalId = req.query.jadwal_id ? parseInt(req.query.jadwal_id) : null;
    const tanggal_start = req.query.tanggal_start || null;
    const tanggal_end = req.query.tanggal_end || null;

    if (!allowedLimits.includes(limit)) limit = 10;
    if (page < 1) page = 1;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    const whereClauses = [];
    const params = [];

    if (jadwalId && !isNaN(jadwalId)) {
      whereClauses.push("lj.jadwal_id = ?");
      params.push(jadwalId);
    }
    if (tanggal_start && !isNaN(Date.parse(tanggal_start))) {
      whereClauses.push("lj.tanggal >= ?");
      params.push(tanggal_start);
    }
    if (tanggal_end && !isNaN(Date.parse(tanggal_end))) {
      whereClauses.push("lj.tanggal <= ?");
      params.push(tanggal_end);
    }

    const whereSQL = whereClauses.length
      ? `WHERE ${whereClauses.join(" AND ")}`
      : "";

    // Count total
    const [countResult] = await conn.query(
      `SELECT COUNT(*) as total FROM libur_jadwal lj ${whereSQL}`,
      params,
    );
    const total = countResult[0].total;
    const totalPage = Math.max(Math.ceil(total / limit), 1);

    // Ambil data libur dengan informasi jadwal (nama, tipe)
    const [rows] = await conn.query(
      `SELECT lj.id, lj.jadwal_id, lj.tanggal, lj.keterangan, lj.created_at,
              j.nama AS jadwal_nama, j.tipe AS jadwal_tipe
       FROM libur_jadwal lj
       JOIN jadwal j ON j.id = lj.jadwal_id
       ${whereSQL}
       ORDER BY lj.tanggal ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    return res.status(200).json({
      message: "Berhasil mengambil semua data libur",
      pagination: {
        page,
        limit,
        total_data: total,
        total_page: totalPage,
        has_next: page < totalPage,
        has_prev: page > 1,
      },
      data: rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal mengambil data libur",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
