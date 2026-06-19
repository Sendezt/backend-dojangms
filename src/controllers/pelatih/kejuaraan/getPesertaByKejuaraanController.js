const db = require("../../../config/database");

const ALLOWED_LIMITS = [10, 25, 50, 75, 100, 200];

exports.getPesertaByKejuaraan = async (req, res) => {
  try {
    const kejuaraanId = parseInt(req.params.kejuaraanId);
    if (isNaN(kejuaraanId) || kejuaraanId < 1) {
      return res
        .status(400)
        .json({ success: false, message: "ID kejuaraan tidak valid" });
    }

    // Cek kejuaraan
    const [kejuaraan] = await db.query(
      "SELECT id, name, start_date, end_date FROM kejuaraan WHERE id = ?",
      [kejuaraanId],
    );
    if (kejuaraan.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Kejuaraan tidak ditemukan" });
    }

    // Pagination
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim() || null;
    const kelasId = req.query.kelas_id ? parseInt(req.query.kelas_id) : null;

    if (!ALLOWED_LIMITS.includes(limit)) limit = 10;
    if (page < 1) page = 1;
    const offset = (page - 1) * limit;

    // Filter
    let where = ["kk.kejuaraan_id = ?"];
    let params = [kejuaraanId];

    if (search) {
      where.push("(u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (kelasId) {
      where.push("kk.id = ?");
      params.push(kelasId);
    }

    const whereClause = where.join(" AND ");

    // Count total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM peserta_kejuaraan pk
      JOIN kelas_kejuaraan kk ON pk.kelas_kejuaraan_id = kk.id
      JOIN users u ON pk.user_id = u.id
      WHERE ${whereClause}
    `;
    const [[{ total }]] = await db.query(countQuery, params);
    const totalPages = Math.ceil(total / limit);

    // Ambil data peserta dengan JOIN ke semua tabel referensi
    const dataQuery = `
      SELECT
        pk.id AS peserta_id,
        u.id AS user_id,
        u.name,
        u.email,
        u.phone,
        u.tanggal_lahir,
        b.id AS belt_id,
        b.name AS belt_name,
        kk.id AS kelas_kejuaraan_id,
        kk.tipe AS kelas_tipe,
        pk.hasil,
        pk.catatan,
        pk.is_edited,
        COALESCE(
          ky.label,
          CONCAT(pj.name, ' (', pf.name, ')')
        ) AS nama_kelas_detail
      FROM peserta_kejuaraan pk
      JOIN kelas_kejuaraan kk ON pk.kelas_kejuaraan_id = kk.id
      JOIN users u ON pk.user_id = u.id
      LEFT JOIN belts b ON pk.belt_id = b.id
      LEFT JOIN kelas_kyorugi ky ON kk.tipe = 'kyorugi' AND kk.kelas_id = ky.id
      LEFT JOIN kelas_poomsae po ON kk.tipe = 'poomsae' AND kk.kelas_id = po.id
      LEFT JOIN poomsae_jurus pj ON po.jurus_id = pj.id
      LEFT JOIN poomsae_format pf ON po.format_id = pf.id
      WHERE ${whereClause}
      ORDER BY u.name ASC
      LIMIT ? OFFSET ?
    `;
    const dataParams = [...params, limit, offset];
    const [rows] = await db.query(dataQuery, dataParams);

    const data = rows.map((row) => ({
      peserta_id: row.peserta_id,
      user: {
        id: row.user_id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        tanggal_lahir: row.tanggal_lahir,
      },
      belt: row.belt_id ? { id: row.belt_id, name: row.belt_name } : null,
      kelas_kejuaraan: {
        id: row.kelas_kejuaraan_id,
        tipe: row.kelas_tipe,
        detail: row.nama_kelas_detail,
      },
      hasil: row.hasil,
      catatan: row.catatan,
      is_edited: row.is_edited === 1,
    }));

    return res.status(200).json({
      success: true,
      message:
        data.length === 0
          ? "Belum ada peserta di kejuaraan ini"
          : "Berhasil mengambil daftar peserta",
      data: {
        kejuaraan: kejuaraan[0],
        peserta: data,
      },
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
      message: "Gagal mengambil daftar peserta",
      error: error.message,
    });
  }
};
