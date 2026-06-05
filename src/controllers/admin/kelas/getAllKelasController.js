const db = require("../../../config/database");

exports.getAllKelas = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const allowedLimits = [10, 25, 50, 75, 100, 200];
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim() || null;
    const status = req.query.status?.trim() || null;

    if (!allowedLimits.includes(limit)) limit = 10;
    if (page < 1) page = 1;
    const offset = (page - 1) * limit;

    // summary total kelas, aktif, nonaktif (TIDAK TERPENGARUH FILTER)
    const [[summary]] = await conn.query(`
      SELECT
        COUNT(*) AS total_kelas,
        SUM(CASE WHEN status = 'aktif' THEN 1 ELSE 0 END) AS total_kelas_aktif,
        SUM(CASE WHEN status = 'nonaktif' THEN 1 ELSE 0 END) AS total_kelas_nonaktif
      FROM kelas
    `);

    // where clause untuk filter search dan status
    const whereClauses = [];
    const whereParams = [];

    if (search) {
      whereClauses.push("(nama LIKE ? OR deskripsi LIKE ?)");
      const like = `%${search}%`;
      whereParams.push(like, like);
    }
    if (status && (status === "aktif" || status === "nonaktif")) {
      whereClauses.push("status = ?");
      whereParams.push(status);
    }

    const whereSQL = whereClauses.length
      ? `WHERE ${whereClauses.join(" AND ")}`
      : "";

    // Total data dengan filter (untuk pagination)
    const [[totalData]] = await conn.query(
      `SELECT COUNT(*) AS total FROM kelas ${whereSQL}`,
      whereParams,
    );
    const total = totalData.total;
    const totalPage = Math.max(Math.ceil(total / limit), 1);

    // Ambil data kelas
    const [rows] = await conn.query(
      `SELECT id, nama, deskripsi, status
       FROM kelas
       ${whereSQL}
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [...whereParams, limit, offset],
    );

    return res.status(200).json({
      message:
        rows.length === 0
          ? "Data kelas masih kosong"
          : "Berhasil mengambil data kelas",
      summary: {
        total_kelas: summary.total_kelas || 0,
        total_kelas_aktif: String(summary.total_kelas_aktif || 0),
        total_kelas_nonaktif: String(summary.total_kelas_nonaktif || 0),
      },
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
      message: "Gagal mengambil data kelas",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
