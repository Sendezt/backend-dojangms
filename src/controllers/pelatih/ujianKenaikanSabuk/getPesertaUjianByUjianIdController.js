const db = require("../../../config/database");

const ALLOWED_LIMITS = [10, 25, 50, 75, 100, 200];

exports.getPesertaUjianByUjianId = async (req, res) => {
  try {
    const ujianId = parseInt(req.params.ujianId);
    if (isNaN(ujianId) || ujianId < 1) {
      return res
        .status(400)
        .json({ success: false, message: "ID ujian tidak valid" });
    }

    // Cek ujian
    const [ujian] = await db.query(
      "SELECT id, level_ujian, tanggal_mulai, tanggal_selesai FROM ujian_sabuk WHERE id = ? AND deleted_at IS NULL",
      [ujianId],
    );
    if (ujian.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Ujian tidak ditemukan" });
    }

    // Validasi periode inputable menggunakan CURDATE()
    const [ujianCheck] = await db.query(
      `SELECT id FROM ujian_sabuk 
       WHERE id = ? 
       AND deleted_at IS NULL
       AND tanggal_mulai <= CURDATE() 
       AND DATE_ADD(tanggal_selesai, INTERVAL 1 MONTH) >= CURDATE()`,
      [ujianId],
    );
    if (ujianCheck.length === 0) {
      return res.status(403).json({
        success: false,
        message:
          "Ujian ini tidak dalam periode input hasil (mulai dari tanggal_mulai sampai H+1 bulan setelah selesai)",
      });
    }

    // Pagination
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim() || null;

    if (!ALLOWED_LIMITS.includes(limit)) limit = 10;
    if (page < 1) page = 1;
    const offset = (page - 1) * limit;

    // Hanya ambil peserta dengan status 'terdaftar'
    let where = ["pu.ujian_id = ?", "pu.status = 'terdaftar'"];
    let params = [ujianId];

    if (search) {
      where.push("(u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = where.join(" AND ");

    // Count total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM peserta_ujian pu
      JOIN users u ON pu.user_id = u.id
      WHERE ${whereClause}
    `;
    const [[{ total }]] = await db.query(countQuery, params);
    const totalPages = Math.ceil(total / limit);

    // Ambil data peserta
    const dataQuery = `
      SELECT
        pu.id AS peserta_id,
        u.id AS user_id,
        u.name,
        u.email,
        u.phone,
        u.tanggal_lahir,
        ba.id AS belt_asal_id,
        ba.name AS belt_asal_nama,
        bt.id AS belt_tujuan_id,
        bt.name AS belt_tujuan_nama,
        pu.status,
        pu.tanggal_lulus,
        pu.tanggal_edit
      FROM peserta_ujian pu
      JOIN users u ON pu.user_id = u.id
      JOIN belts ba ON pu.belt_asal_id = ba.id
      JOIN belts bt ON pu.belt_tujuan_id = bt.id
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
      belt_asal: { id: row.belt_asal_id, name: row.belt_asal_nama },
      belt_tujuan: { id: row.belt_tujuan_id, name: row.belt_tujuan_nama },
      status: row.status,
      tanggal_lulus: row.tanggal_lulus,
      tanggal_edit: row.tanggal_edit,
    }));

    return res.status(200).json({
      success: true,
      message:
        data.length === 0
          ? "Tidak ada peserta yang perlu diinput"
          : "Berhasil mengambil daftar peserta",
      data: {
        ujian: ujian[0],
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
