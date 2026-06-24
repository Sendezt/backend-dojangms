const db = require("../../../config/database");

exports.getRekapAbsensi = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const allowedLimits = [10, 25, 50, 75, 100, 200];
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const kelasId = req.query.kelas_id ? parseInt(req.query.kelas_id) : null;
    const jadwalId = req.query.jadwal_id ? parseInt(req.query.jadwal_id) : null;
    const muridId = req.query.user_id ? parseInt(req.query.user_id) : null;
    const status = req.query.status || null; // hadir, izin, sakit, alpha
    const tanggalStart = req.query.tanggal_start || null;
    const tanggalEnd = req.query.tanggal_end || null;

    if (!allowedLimits.includes(limit)) limit = 10;
    if (page < 1) page = 1;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClauses = [];
    const params = [];
    if (kelasId) {
      whereClauses.push("a.kelas_id = ?");
      params.push(kelasId);
    }
    if (jadwalId) {
      whereClauses.push("a.jadwal_id = ?");
      params.push(jadwalId);
    }
    if (muridId) {
      whereClauses.push("a.user_id = ?");
      params.push(muridId);
    }
    if (status && ["hadir", "izin", "sakit", "alpha"].includes(status)) {
      whereClauses.push("a.status = ?");
      params.push(status);
    }
    if (tanggalStart && !isNaN(Date.parse(tanggalStart))) {
      whereClauses.push("a.tanggal >= ?");
      params.push(tanggalStart);
    }
    if (tanggalEnd && !isNaN(Date.parse(tanggalEnd))) {
      whereClauses.push("a.tanggal <= ?");
      params.push(tanggalEnd);
    }
    const whereSQL = whereClauses.length
      ? `WHERE ${whereClauses.join(" AND ")}`
      : "";

    // Total data
    const [countResult] = await conn.query(
      `SELECT COUNT(*) as total FROM absensi a ${whereSQL}`,
      params,
    );
    const total = countResult[0].total;
    const totalPage = Math.max(Math.ceil(total / limit), 1);

    // Ambil data dengan join kelas, jadwal, dan murid
    const [rows] = await conn.query(
      `SELECT a.id, a.kelas_id, a.jadwal_id, a.user_id, a.tanggal, a.status, a.catatan, a.dicatat_oleh, a.created_at,
              k.nama AS kelas_nama,
              j.nama AS jadwal_nama, j.tipe AS jadwal_tipe,
              u.name AS murid_nama,
              pencatat.name AS dicatat_oleh_nama
       FROM absensi a
       LEFT JOIN kelas k ON k.id = a.kelas_id
       LEFT JOIN jadwal j ON j.id = a.jadwal_id
       LEFT JOIN users u ON u.id = a.user_id
       LEFT JOIN users pencatat ON pencatat.id = a.dicatat_oleh
       ${whereSQL}
       ORDER BY a.tanggal DESC, a.kelas_id, a.user_id
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    return res.status(200).json({
      message: "Berhasil mengambil data absensi",
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
      message: "Gagal mengambil data absensi",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
