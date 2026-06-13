// src/controllers/admin/ujianSabuk/getAllUjianSabukController.js
const db = require("../../../config/database");

const ALLOWED_LIMITS = [10, 25, 50, 75, 100, 200];

exports.getAllUjianSabuk = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || null;
    const level = req.query.level || null;
    const search = req.query.search?.trim() || null;

    if (!ALLOWED_LIMITS.includes(limit)) limit = 10;
    if (page < 1) page = 1;
    const offset = (page - 1) * limit;

    // WHERE untuk data (bisa difilter status, level, search) - tidak menyaring deleted_at
    let whereData = [];
    let paramsData = [];

    if (status && ["terjadwal", "selesai", "dibatalkan"].includes(status)) {
      whereData.push("status = ?");
      paramsData.push(status);
    }
    if (level && ["kota", "provinsi"].includes(level)) {
      whereData.push("level_ujian = ?");
      paramsData.push(level);
    }
    if (search) {
      whereData.push("(lokasi LIKE ? OR keterangan LIKE ?)");
      paramsData.push(`%${search}%`, `%${search}%`);
    }

    const whereClauseData = whereData.length
      ? "WHERE " + whereData.join(" AND ")
      : "";

    // Total data (termasuk yang sudah dihapus)
    const countQuery = `SELECT COUNT(*) as total FROM ujian_sabuk ${whereClauseData}`;
    const [[{ total }]] = await db.query(countQuery, paramsData);
    const totalPages = Math.ceil(total / limit);

    // Ambil data (termasuk deleted_at)
    const dataQuery = `
      SELECT id, tanggal_mulai, tanggal_selesai, level_ujian, lokasi, keterangan, status, created_at, deleted_at
      FROM ujian_sabuk
      ${whereClauseData}
      ORDER BY tanggal_mulai DESC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await db.query(dataQuery, [...paramsData, limit, offset]);

    // WHERE untuk summary (tanpa filter status, tetapi tetap pakai level dan search) - tanpa filter deleted_at
    let whereSummary = [];
    let paramsSummary = [];

    if (level && ["kota", "provinsi"].includes(level)) {
      whereSummary.push("level_ujian = ?");
      paramsSummary.push(level);
    }
    if (search) {
      whereSummary.push("(lokasi LIKE ? OR keterangan LIKE ?)");
      paramsSummary.push(`%${search}%`, `%${search}%`);
    }

    const whereClauseSummary = whereSummary.length
      ? "WHERE " + whereSummary.join(" AND ")
      : "";

    // Summary total, per status, per level (termasuk data yang sudah dihapus)
    const summaryQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'terjadwal' THEN 1 ELSE 0 END) as terjadwal,
        SUM(CASE WHEN status = 'selesai' THEN 1 ELSE 0 END) as selesai,
        SUM(CASE WHEN status = 'dibatalkan' THEN 1 ELSE 0 END) as dibatalkan,
        SUM(CASE WHEN level_ujian = 'kota' THEN 1 ELSE 0 END) as total_kota,
        SUM(CASE WHEN level_ujian = 'provinsi' THEN 1 ELSE 0 END) as total_provinsi
      FROM ujian_sabuk
      ${whereClauseSummary}
    `;
    const [summaryRows] = await db.query(summaryQuery, paramsSummary);
    const summary = summaryRows[0] || {
      total: 0,
      terjadwal: 0,
      selesai: 0,
      dibatalkan: 0,
      total_kota: 0,
      total_provinsi: 0,
    };

    return res.status(200).json({
      message: "Berhasil mengambil daftar ujian sabuk (termasuk yang dihapus)",
      pagination: {
        current_page: page,
        per_page: limit,
        total_page: totalPages,
        total_data: total,
        has_next: page < totalPages,
        has_prev: page > 1,
      },
      summary: {
        total: summary.total,
        terjadwal: summary.terjadwal,
        selesai: summary.selesai,
        dibatalkan: summary.dibatalkan,
        kota: summary.total_kota,
        provinsi: summary.total_provinsi,
      },
      data: rows.map((row) => ({
        ...row,
        deleted_at: row.deleted_at, // null atau berisi tanggal
      })),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal mengambil data ujian sabuk",
      error: error.message,
    });
  }
};
