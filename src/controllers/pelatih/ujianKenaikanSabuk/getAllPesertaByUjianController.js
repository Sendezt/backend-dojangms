const db = require("../../../config/database");

const ALLOWED_LIMITS = [10, 25, 50, 75, 100, 200];

exports.getAllPesertaUjianByUjianId = async (req, res) => {
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

    // ===== SUMMARY: semua peserta di ujian ini (tanpa filter) =====
    const [summaryResult] = await db.query(
      `SELECT 
        COUNT(*) AS total_peserta,
        SUM(CASE WHEN tanggal_edit IS NOT NULL THEN 1 ELSE 0 END) AS sudah_diedit
       FROM peserta_ujian
       WHERE ujian_id = ?`,
      [ujianId],
    );
    const totalPeserta = parseInt(summaryResult[0]?.total_peserta) || 0;
    const sudahDiedit = parseInt(summaryResult[0]?.sudah_diedit) || 0;
    const belumDiedit = totalPeserta - sudahDiedit;
    const persentaseEdit =
      totalPeserta > 0
        ? parseFloat(((sudahDiedit / totalPeserta) * 100).toFixed(2))
        : 0;

    // Pagination
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim() || null;
    const filterStatus = req.query.status || null;

    if (!ALLOWED_LIMITS.includes(limit)) limit = 10;
    if (page < 1) page = 1;
    const offset = (page - 1) * limit;

    // Build WHERE clause
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

    // Count total (dengan filter)
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
          : "Berhasil mengambil daftar peserta",
      data: {
        ujian: ujian[0],
        summary: {
          total_peserta: totalPeserta,
          sudah_diedit: sudahDiedit,
          belum_diedit: belumDiedit,
          persentase_edit: persentaseEdit,
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
      message: "Gagal mengambil daftar peserta",
      error: error.message,
    });
  }
};
