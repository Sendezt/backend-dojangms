const db = require("../../../config/database");

const ALLOWED_LIMITS = [10, 25, 50, 75, 100, 200];

exports.getHasilPesertaByUjianId = async (req, res) => {
  try {
    const ujianId = parseInt(req.params.ujianId);
    if (isNaN(ujianId) || ujianId < 1) {
      return res
        .status(400)
        .json({ success: false, message: "ID ujian tidak valid" });
    }

    // 1. Cek apakah ujian ada
    const [ujian] = await db.query(
      "SELECT id, level_ujian, lokasi, keterangan, status, tanggal_mulai, tanggal_selesai FROM ujian_sabuk WHERE id = ? AND deleted_at IS NULL",
      [ujianId],
    );
    if (ujian.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Ujian tidak ditemukan" });
    }

    // 2. Pagination & filter
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim() || null;
    const filterStatus = req.query.status || null; // terdaftar, lulus, tidak_lulus

    if (!ALLOWED_LIMITS.includes(limit)) limit = 10;
    if (page < 1) page = 1;
    const offset = (page - 1) * limit;

    // 3. Build WHERE clause
    let where = ["pu.ujian_id = ?"];
    let params = [ujianId];

    if (search) {
      where.push("(u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (filterStatus) {
      if (["terdaftar", "lulus", "tidak_lulus"].includes(filterStatus)) {
        where.push("pu.status = ?");
        params.push(filterStatus);
      } else {
        return res.status(400).json({
          success: false,
          message: "Status filter harus: terdaftar, lulus, atau tidak_lulus",
        });
      }
    }

    const whereClause = where.join(" AND ");

    // 4. Hitung total (dengan filter)
    const countQuery = `
      SELECT COUNT(*) as total
      FROM peserta_ujian pu
      JOIN users u ON pu.user_id = u.id
      WHERE ${whereClause}
    `;
    const [[{ total }]] = await db.query(countQuery, params);
    const totalPages = Math.ceil(total / limit);

    // 5. Ambil data peserta dengan detail lengkap
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
      ORDER BY 
        CASE pu.status 
          WHEN 'lulus' THEN 1
          WHEN 'tidak_lulus' THEN 2
          WHEN 'terdaftar' THEN 3
        END,
        u.name ASC
      LIMIT ? OFFSET ?
    `;
    const dataParams = [...params, limit, offset];
    const [rows] = await db.query(dataQuery, dataParams);

    // 6. Hitung statistik summary (SEMUA peserta, tidak terpengaruh filter halaman)
    const summaryQuery = `
      SELECT
        COUNT(*) AS total_peserta,
        SUM(CASE WHEN status = 'terdaftar' THEN 1 ELSE 0 END) AS terdaftar,
        SUM(CASE WHEN status = 'lulus' THEN 1 ELSE 0 END) AS lulus,
        SUM(CASE WHEN status = 'tidak_lulus' THEN 1 ELSE 0 END) AS tidak_lulus,
        SUM(CASE WHEN tanggal_edit IS NOT NULL THEN 1 ELSE 0 END) AS sudah_diedit
      FROM peserta_ujian
      WHERE ujian_id = ?
    `;
    const [summaryResult] = await db.query(summaryQuery, [ujianId]);
    const summary = summaryResult[0] || {
      total_peserta: 0,
      terdaftar: 0,
      lulus: 0,
      tidak_lulus: 0,
      sudah_diedit: 0,
    };

    // Format data peserta
    const peserta = rows.map((row) => ({
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
        peserta.length === 0
          ? "Belum ada peserta dalam ujian ini"
          : "Berhasil mengambil data hasil ujian",
      data: {
        ujian: ujian[0],
        summary: {
          total_peserta: summary.total_peserta || 0,
          terdaftar: summary.terdaftar || 0,
          lulus: summary.lulus || 0,
          tidak_lulus: summary.tidak_lulus || 0,
          sudah_diedit: summary.sudah_diedit || 0,
          persentase_lulus:
            summary.total_peserta > 0
              ? parseFloat(
                  ((summary.lulus / summary.total_peserta) * 100).toFixed(2),
                )
              : 0,
          persentase_tidak_lulus:
            summary.total_peserta > 0
              ? parseFloat(
                  ((summary.tidak_lulus / summary.total_peserta) * 100).toFixed(
                    2,
                  ),
                )
              : 0,
        },
        peserta: peserta,
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
      message: "Gagal mengambil data hasil ujian",
      error: error.message,
    });
  }
};
