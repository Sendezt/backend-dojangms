const db = require("../../../config/database");
const ALLOWED_LIMITS = [10, 25, 50, 75, 100, 200];

exports.getPelatihKelas = async (req, res) => {
  try {
    const pelatihId = req.user.id; // ID dari token JWT

    // Pagination & search
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim() || null;

    if (!ALLOWED_LIMITS.includes(limit)) limit = 10;
    if (page < 1) page = 1;
    const offset = (page - 1) * limit;

    let where = ["kp.user_id = ?", "kp.status = 'aktif'", "k.status = 'aktif'"];
    let params = [pelatihId];

    if (search) {
      where.push("k.nama LIKE ?");
      params.push(`%${search}%`);
    }

    const whereClause = "WHERE " + where.join(" AND ");

    // Count total kelas
    const countQuery = `
      SELECT COUNT(DISTINCT k.id) as total
      FROM kelas_pelatih kp
      JOIN kelas k ON kp.kelas_id = k.id
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
        (
          SELECT COUNT(*) 
          FROM kelas_murid km 
          WHERE km.kelas_id = k.id AND km.status = 'aktif'
        ) AS jumlah_murid,
        (
          SELECT COUNT(*) 
          FROM jadwal j 
          WHERE j.kelas_id = k.id AND j.tipe = 'kelas' AND j.status = 'aktif'
        ) AS jumlah_jadwal
      FROM kelas_pelatih kp
      JOIN kelas k ON kp.kelas_id = k.id
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
      jumlah_murid: row.jumlah_murid,
      jumlah_jadwal: row.jumlah_jadwal,
    }));

    return res.status(200).json({
      success: true,
      message: data.length
        ? "Berhasil mengambil daftar kelas"
        : "Tidak ada kelas yang diampu",
      data,
      meta: {
        pagination: {
          current_page: page,
          per_page: limit,
          total_page: totalPages,
          total_data: total,
          has_next: page < totalPages,
          has_prev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data kelas",
      error: error.message,
    });
  }
};
