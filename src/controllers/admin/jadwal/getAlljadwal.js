const db = require("../../../config/database");

exports.getAllJadwal = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const allowedLimits = [10, 25, 50, 75, 100, 200];
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const tipe = req.query.tipe;
    const kelas_id = req.query.kelas_id ? parseInt(req.query.kelas_id) : null;
    const status = req.query.status || null;

    if (!allowedLimits.includes(limit)) limit = 10;
    if (page < 1) page = 1;
    const offset = (page - 1) * limit;

    // Summary total (tanpa join)
    let summaryQuery = `
      SELECT 
        COUNT(*) AS total_jadwal,
        SUM(CASE WHEN tipe = 'latihan_wajib' THEN 1 ELSE 0 END) AS total_latihan_wajib,
        SUM(CASE WHEN tipe = 'training_camp' THEN 1 ELSE 0 END) AS total_training_camp,
        SUM(CASE WHEN tipe = 'kelas' THEN 1 ELSE 0 END) AS total_kelas,
        SUM(CASE WHEN status = 'aktif' THEN 1 ELSE 0 END) AS total_aktif,
        SUM(CASE WHEN status = 'nonaktif' THEN 1 ELSE 0 END) AS total_nonaktif
      FROM jadwal
    `;
    const [summary] = await conn.query(summaryQuery);

    // WHERE clause untuk filter
    const whereClauses = [];
    const params = [];

    if (tipe && ["latihan_wajib", "training_camp", "kelas"].includes(tipe)) {
      whereClauses.push("j.tipe = ?");
      params.push(tipe);
    }
    if (kelas_id && !isNaN(kelas_id)) {
      whereClauses.push("j.kelas_id = ?");
      params.push(kelas_id);
    }
    if (status && ["aktif", "nonaktif"].includes(status)) {
      whereClauses.push("j.status = ?");
      params.push(status);
    }

    const whereSQL = whereClauses.length
      ? `WHERE ${whereClauses.join(" AND ")}`
      : "";

    // Total filtered data (untuk pagination)
    const [countResult] = await conn.query(
      `SELECT COUNT(*) as total FROM jadwal j ${whereSQL}`,
      params,
    );
    const total = countResult[0].total;
    const totalPage = Math.max(Math.ceil(total / limit), 1);

    // Ambil data dengan LEFT JOIN ke kelas untuk mendapatkan nama kelas
    const [rows] = await conn.query(
      `SELECT 
        j.id, j.tipe, j.nama, j.kelas_id, j.hari, j.effective_from, j.effective_until,
        j.tanggal_mulai, j.tanggal_selesai, j.jam_mulai, j.jam_selesai,
        j.lokasi, j.keterangan, j.status, j.dibuat_oleh, j.created_at, j.updated_at,
        k.nama AS kelas_nama
       FROM jadwal j
       LEFT JOIN kelas k ON j.kelas_id = k.id
       ${whereSQL}
       ORDER BY 
         CASE j.tipe
           WHEN 'latihan_wajib' THEN 1
           WHEN 'kelas' THEN 2
           WHEN 'training_camp' THEN 3
         END,
         j.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    return res.status(200).json({
      message: "Berhasil mengambil data jadwal",
      summary: {
        total_jadwal: summary[0].total_jadwal || 0,
        total_latihan_wajib: summary[0].total_latihan_wajib || 0,
        total_training_camp: summary[0].total_training_camp || 0,
        total_kelas: summary[0].total_kelas || 0,
        total_aktif: String(summary[0].total_aktif || 0),
        total_nonaktif: String(summary[0].total_nonaktif || 0),
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
      message: "Gagal mengambil data jadwal",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
