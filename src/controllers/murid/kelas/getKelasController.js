const db = require("../../../config/database");
const ALLOWED_LIMITS = [10, 25, 50, 75, 100, 200];

/**
 * GET /api/user/kelas
 * Daftar kelas yang diikuti oleh murid yang sedang login, dengan summary
 */
exports.getKelasMurid = async (req, res) => {
  try {
    const userId = req.user.id;
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim() || null;
    const status = req.query.status || null; // 'aktif' / 'nonaktif'

    if (!ALLOWED_LIMITS.includes(limit)) limit = 10;
    if (page < 1) page = 1;
    const offset = (page - 1) * limit;

    // ===== SUMMARY: total kelas yang diikuti =====
    const [summaryResult] = await db.query(
      `SELECT 
        COUNT(*) AS total_kelas,
        SUM(CASE WHEN k.status = 'aktif' THEN 1 ELSE 0 END) AS aktif,
        SUM(CASE WHEN k.status = 'nonaktif' THEN 1 ELSE 0 END) AS nonaktif
       FROM kelas_murid km
       JOIN kelas k ON km.kelas_id = k.id
       WHERE km.user_id = ? AND km.status = 'aktif'`,
      [userId],
    );
    const summary = {
      total_kelas: summaryResult[0]?.total_kelas || 0,
      aktif: summaryResult[0]?.aktif || 0,
      nonaktif: summaryResult[0]?.nonaktif || 0,
    };

    // ===== LIST KELAS (dengan filter) =====
    let where = ["km.user_id = ?", "km.status = 'aktif'"];
    let params = [userId];

    if (status && ["aktif", "nonaktif"].includes(status)) {
      where.push("k.status = ?");
      params.push(status);
    }
    if (search) {
      where.push("(k.nama LIKE ? OR k.deskripsi LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = "WHERE " + where.join(" AND ");

    // Count total (dengan filter)
    const countQuery = `
      SELECT COUNT(*) as total
      FROM kelas_murid km
      JOIN kelas k ON km.kelas_id = k.id
      ${whereClause}
    `;
    const [[{ total }]] = await db.query(countQuery, params);
    const totalPages = Math.ceil(total / limit);

    // Ambil data kelas
    const dataQuery = `
      SELECT
        k.id,
        k.nama,
        k.deskripsi,
        k.status,
        k.created_at,
        km.tanggal_bergabung,
        (
          SELECT COUNT(*) 
          FROM jadwal j 
          WHERE j.kelas_id = k.id 
            AND j.tipe = 'kelas' 
            AND j.status = 'aktif'
        ) AS jumlah_jadwal_aktif,
        (
          SELECT COUNT(*) 
          FROM kelas_pelatih kp 
          WHERE kp.kelas_id = k.id 
            AND kp.status = 'aktif'
        ) AS jumlah_pelatih
      FROM kelas_murid km
      JOIN kelas k ON km.kelas_id = k.id
      ${whereClause}
      ORDER BY k.nama ASC
      LIMIT ? OFFSET ?
    `;
    const dataParams = [...params, limit, offset];
    const [rows] = await db.query(dataQuery, dataParams);

    const data = rows.map((row) => ({
      id: row.id,
      nama: row.nama,
      deskripsi: row.deskripsi,
      status: row.status,
      created_at: row.created_at,
      tanggal_bergabung: row.tanggal_bergabung,
      jumlah_jadwal_aktif: row.jumlah_jadwal_aktif || 0,
      jumlah_pelatih: row.jumlah_pelatih || 0,
    }));

    return res.status(200).json({
      success: true,
      message:
        data.length === 0
          ? "Tidak ada kelas yang diikuti"
          : "Berhasil mengambil daftar kelas",
      summary, // tambahan summary
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
      success: false,
      message: "Gagal mengambil daftar kelas",
      error: error.message,
    });
  }
};
