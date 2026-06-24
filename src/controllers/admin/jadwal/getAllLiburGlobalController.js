const db = require("../../../config/database");

exports.getAllLiburGlobal = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const allowedLimits = [10, 25, 50, 75, 100, 200];
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const tanggal_start = req.query.tanggal_start || null;
    const tanggal_end = req.query.tanggal_end || null;

    if (!allowedLimits.includes(limit)) limit = 10;
    if (page < 1) page = 1;
    const offset = (page - 1) * limit;

    // Filter
    const whereClauses = [];
    const params = [];
    if (tanggal_start && !isNaN(Date.parse(tanggal_start))) {
      whereClauses.push("tanggal >= ?");
      params.push(tanggal_start);
    }
    if (tanggal_end && !isNaN(Date.parse(tanggal_end))) {
      whereClauses.push("tanggal <= ?");
      params.push(tanggal_end);
    }
    const whereSQL = whereClauses.length
      ? `WHERE ${whereClauses.join(" AND ")}`
      : "";

    // Total count
    const [countResult] = await conn.query(
      `SELECT COUNT(*) as total FROM libur_global ${whereSQL}`,
      params,
    );
    const total = countResult[0].total;
    const totalPage = Math.max(Math.ceil(total / limit), 1);

    // Data
    const [rows] = await conn.query(
      `SELECT id, tanggal, keterangan, created_at FROM libur_global
       ${whereSQL}
       ORDER BY tanggal ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    return res.status(200).json({
      message: "Berhasil mengambil data libur global",
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
      message: "Gagal mengambil data libur global",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
