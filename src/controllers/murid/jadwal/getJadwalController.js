const db = require("../../../config/database");
const ALLOWED_LIMITS = [10, 25, 50, 75, 100, 200];

/**
 * GET /api/user/jadwal
 * Daftar semua jadwal yang relevan untuk murid:
 * - Jadwal kelas yang diikuti (tipe='kelas', dari kelas_murid)
 * - Jadwal latihan wajib (tipe='latihan_wajib', global)
 * - Jadwal training camp (tipe='training_camp') dari kejuaraan yang diikuti,
 *   hanya yang sudah dimulai (tanggal_mulai <= hari ini)
 */
exports.getAllJadwalMurid = async (req, res) => {
  try {
    const userId = req.user.id;

    // Pagination
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim() || null;
    const statusFilter = req.query.status || "aktif";
    const hari = req.query.hari || null;
    const startDate = req.query.start_date || null;
    const endDate = req.query.end_date || null;

    if (!ALLOWED_LIMITS.includes(limit)) limit = 10;
    if (page < 1) page = 1;
    const offset = (page - 1) * limit;

    // 1. Ambil daftar kelas yang diikuti user (aktif)
    const [kelasUser] = await db.query(
      `SELECT kelas_id FROM kelas_murid WHERE user_id = ? AND status = 'aktif'`,
      [userId],
    );
    const kelasIds = kelasUser.map((k) => k.kelas_id);

    // 2. Ambil daftar kejuaraan yang diikuti user (dari peserta_kejuaraan)
    const [kejuaraanUser] = await db.query(
      `SELECT DISTINCT kk.kejuaraan_id 
       FROM peserta_kejuaraan pk
       JOIN kelas_kejuaraan kk ON pk.kelas_kejuaraan_id = kk.id
       WHERE pk.user_id = ?`,
      [userId],
    );
    const kejuaraanIds = kejuaraanUser.map((k) => k.kejuaraan_id);

    // 3. Bangun kondisi WHERE untuk jadwal kelas, latihan wajib, dan training camp
    let whereConditions = [];
    let params = [];

    // Bagian 1: Jadwal kelas (tipe='kelas') yang kelasnya diikuti user
    if (kelasIds.length > 0) {
      whereConditions.push(
        `(j.tipe = 'kelas' AND j.kelas_id IN (${kelasIds.map(() => "?").join(",")}))`,
      );
      params.push(...kelasIds);
    }

    // Bagian 2: Jadwal latihan wajib (tipe='latihan_wajib') – global untuk semua murid
    whereConditions.push(`(j.tipe = 'latihan_wajib' AND j.kelas_id IS NULL)`);

    // Bagian 3: Jadwal training camp dari kejuaraan yang diikuti user
    if (kejuaraanIds.length > 0) {
      whereConditions.push(
        `(j.tipe = 'training_camp' AND j.kejuaraan_id IN (${kejuaraanIds.map(() => "?").join(",")}))`,
      );
      params.push(...kejuaraanIds);
    }

    // Gabungkan dengan OR
    const whereClause =
      whereConditions.length > 0 ? `(${whereConditions.join(" OR ")})` : "1=0";

    // Filter status jadwal (aktif/nonaktif)
    let statusCondition = "";
    if (statusFilter && ["aktif", "nonaktif"].includes(statusFilter)) {
      statusCondition = `AND j.status = ?`;
      params.push(statusFilter);
    } else {
      statusCondition = `AND j.status = 'aktif'`;
    }

    // Filter hari
    if (
      hari &&
      ["senin", "selasa", "rabu", "kamis", "jumat", "sabtu", "minggu"].includes(
        hari,
      )
    ) {
      statusCondition += ` AND j.hari = ?`;
      params.push(hari);
    }

    // Filter pencarian
    if (search) {
      statusCondition += ` AND (j.nama LIKE ?)`;
      params.push(`%${search}%`);
    }

    // Filter rentang tanggal (overlap) untuk semua jadwal
    let dateCondition = "";
    if (startDate && endDate) {
      dateCondition = `
        AND (
          (j.effective_from IS NOT NULL AND j.effective_from <= ? AND (j.effective_until IS NULL OR j.effective_until >= ?))
          OR
          (j.tanggal_mulai IS NOT NULL AND j.tanggal_mulai <= ? AND j.tanggal_selesai >= ?)
        )
      `;
      params.push(endDate, startDate, endDate, startDate);
    } else if (startDate) {
      dateCondition = ` AND ((j.effective_from >= ?) OR (j.tanggal_mulai >= ?))`;
      params.push(startDate, startDate);
    } else if (endDate) {
      dateCondition = ` AND ((j.effective_until <= ?) OR (j.tanggal_selesai <= ?))`;
      params.push(endDate, endDate);
    }

    // ===== TAMBAHAN: Training camp hanya muncul jika sudah dimulai =====
    const trainingCampCondition = `
      AND (j.tipe != 'training_camp' OR (j.tipe = 'training_camp' AND j.tanggal_mulai <= CURDATE()))
    `;

    // Query lengkap
    const fullWhere = `WHERE (${whereClause}) ${statusCondition} ${dateCondition} ${trainingCampCondition}`;

    // Count total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM jadwal j
      LEFT JOIN kelas k ON j.kelas_id = k.id
      ${fullWhere}
    `;
    const [[{ total }]] = await db.query(countQuery, params);
    const totalPages = Math.ceil(total / limit);

    // Ambil data jadwal
    const dataQuery = `
      SELECT 
        j.id,
        j.nama AS jadwal_nama,
        j.tipe,
        j.hari,
        j.effective_from,
        j.effective_until,
        j.tanggal_mulai,
        j.tanggal_selesai,
        j.jam_mulai,
        j.jam_selesai,
        j.lokasi,
        j.status,
        k.id AS kelas_id,
        k.nama AS kelas_nama,
        k.deskripsi AS kelas_deskripsi,
        k.status AS kelas_status,
        j.kejuaraan_id,
        CASE 
          WHEN j.tipe = 'latihan_wajib' THEN 'latihan_wajib'
          WHEN j.tipe = 'kelas' THEN 'kelas'
          WHEN j.tipe = 'training_camp' THEN 'training_camp'
          ELSE j.tipe
        END AS sumber,
        (SELECT name FROM kejuaraan WHERE id = j.kejuaraan_id) AS kejuaraan_nama
      FROM jadwal j
      LEFT JOIN kelas k ON j.kelas_id = k.id
      ${fullWhere}
      ORDER BY 
        COALESCE(COALESCE(j.tanggal_mulai, j.effective_from), '9999-12-31') ASC,
        j.hari ASC,
        j.jam_mulai ASC
      LIMIT ? OFFSET ?
    `;
    const dataParams = [...params, limit, offset];
    const [rows] = await db.query(dataQuery, dataParams);

    // Enrich status jadwal (akan datang / berlangsung / selesai)
    const now = new Date().toISOString().split("T")[0];
    const enrichedRows = rows.map((row) => {
      let statusJadwal = "aktif";
      if (row.tanggal_mulai && row.tanggal_selesai) {
        if (row.tanggal_selesai < now) statusJadwal = "selesai";
        else if (row.tanggal_mulai > now) statusJadwal = "akan_datang";
        else statusJadwal = "berlangsung";
      } else if (row.effective_from && row.effective_until) {
        if (row.effective_until < now) statusJadwal = "selesai";
        else if (row.effective_from > now) statusJadwal = "akan_datang";
        else statusJadwal = "berlangsung";
      } else if (row.effective_from) {
        if (row.effective_from > now) statusJadwal = "akan_datang";
        else statusJadwal = "berlangsung";
      }
      return { ...row, status_jadwal: statusJadwal };
    });

    return res.status(200).json({
      success: true,
      message:
        rows.length === 0
          ? "Tidak ada jadwal"
          : "Berhasil mengambil daftar jadwal",
      data: enrichedRows,
      summary: { total_jadwal: total },
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
      message: "Gagal mengambil daftar jadwal",
      error: error.message,
    });
  }
};
