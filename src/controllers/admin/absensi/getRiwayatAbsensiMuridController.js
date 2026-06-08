const db = require("../../../config/database");

exports.getRiwayatAbsensiMurid = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId) || userId < 1) {
      return res.status(400).json({ message: "ID murid tidak valid" });
    }

    // Cek apakah user adalah murid (opsional)
    const [roleCheck] = await conn.query(
      `SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id 
       WHERE ur.user_id = ? AND r.name = 'murid'`,
      [userId],
    );
    if (roleCheck.length === 0) {
      return res.status(404).json({ message: "Murid tidak ditemukan" });
    }

    // Query params
    const allowedLimits = [10, 25, 50, 75, 100, 200];
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const kelasId = req.query.kelas_id ? parseInt(req.query.kelas_id) : null;
    const status = req.query.status || null;
    const tanggalStart = req.query.tanggal_start || null;
    const tanggalEnd = req.query.tanggal_end || null;

    if (!allowedLimits.includes(limit)) limit = 10;
    if (page < 1) page = 1;
    const offset = (page - 1) * limit;

    // WHERE clause
    const whereClauses = ["a.user_id = ?"];
    const params = [userId];
    if (kelasId) {
      whereClauses.push("a.kelas_id = ?");
      params.push(kelasId);
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
    const whereSQL = `WHERE ${whereClauses.join(" AND ")}`;

    // Count total
    const [countResult] = await conn.query(
      `SELECT COUNT(*) as total FROM absensi a ${whereSQL}`,
      params,
    );
    const total = countResult[0].total;
    const totalPage = Math.max(Math.ceil(total / limit), 1);

    // Data riwayat
    const [rows] = await conn.query(
      `SELECT a.id, a.kelas_id, a.jadwal_id, a.tanggal, a.status, a.catatan, a.created_at,
              k.nama AS kelas_nama,
              j.nama AS jadwal_nama, j.tipe AS jadwal_tipe
       FROM absensi a
       LEFT JOIN kelas k ON k.id = a.kelas_id
       LEFT JOIN jadwal j ON j.id = a.jadwal_id
       ${whereSQL}
       ORDER BY a.tanggal DESC, a.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    return res.status(200).json({
      message: "Berhasil mengambil riwayat absensi murid",
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
      message: "Gagal mengambil riwayat absensi",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
