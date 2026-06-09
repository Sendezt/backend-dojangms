const db = require("../../../config/database");

const ALLOWED_LIMITS = [10, 25, 50, 75, 100, 200];
const ALLOWED_LEVELS = ["kota", "provinsi", "nasional", "internasional"];
const ALLOWED_STATUS = ["akan_datang", "berlangsung", "selesai"];

exports.getAllKejuaraan = async (req, res) => {
  try {
    // 1. Parse & validasi query params
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim() || null;
    const level = req.query.level?.trim() || null;
    const status = req.query.status?.trim() || null;

    if (!ALLOWED_LIMITS.includes(limit)) limit = 10;
    if (page < 1) page = 1;
    if (level && !ALLOWED_LEVELS.includes(level)) {
      return res.status(400).json({
        success: false,
        message:
          "Level tidak valid. Pilihan: kota, provinsi, nasional, internasional",
      });
    }
    if (status && !ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Status tidak valid. Pilihan: akan_datang, berlangsung, selesai",
      });
    }

    const offset = (page - 1) * limit;

    // 2. Bangun WHERE clause dinamis (tanpa status filter untuk summary)
    const whereConditions = [];
    const params = [];

    if (search) {
      whereConditions.push("(name LIKE ? OR location LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }
    if (level) {
      whereConditions.push("level = ?");
      params.push(level);
    }

    const whereClause = whereConditions.length
      ? "WHERE " + whereConditions.join(" AND ")
      : "";

    // 3. Hitung summary (berdasarkan filter yang sama, tanpa status)
    const summaryQuery = `
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN start_date > CURDATE() THEN 1 ELSE 0 END) AS akan_datang,
        SUM(CASE WHEN start_date <= CURDATE() AND end_date >= CURDATE() THEN 1 ELSE 0 END) AS berlangsung,
        SUM(CASE WHEN end_date < CURDATE() THEN 1 ELSE 0 END) AS selesai
      FROM kejuaraan
      ${whereClause}
    `;
    const [[summary]] = await db.execute(summaryQuery, params);

    // 4. Tambahkan filter status untuk query data
    let statusCondition = "";
    const dataParams = [...params];
    if (status === "akan_datang") {
      statusCondition = "AND start_date > CURDATE()";
    } else if (status === "berlangsung") {
      statusCondition = "AND start_date <= CURDATE() AND end_date >= CURDATE()";
    } else if (status === "selesai") {
      statusCondition = "AND end_date < CURDATE()";
    }

    // Tambahkan WHERE jika whereClause kosong tapi statusCondition ada
    let finalStatusCondition = statusCondition;
    if (!whereClause && statusCondition) {
      finalStatusCondition = statusCondition.replace("AND ", "WHERE ");
    }

    // 5. Hitung total data dengan filter status
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM kejuaraan
      ${whereClause}
      ${finalStatusCondition}
    `;
    const [[totalRow]] = await db.execute(countQuery, dataParams);
    const totalData = totalRow.total || 0;
    const totalPages = Math.ceil(totalData / limit);

    // 6. Ambil data dengan pagination
    // LIMIT & OFFSET di-interpolasi langsung (aman karena sudah divalidasi)
    const dataQuery = `
      SELECT 
        id,
        name,
        level,
        location,
        start_date,
        end_date,
        CASE
          WHEN start_date > CURDATE() THEN 'akan_datang'
          WHEN start_date <= CURDATE() AND end_date >= CURDATE() THEN 'berlangsung'
          ELSE 'selesai'
        END AS status
      FROM kejuaraan
      ${whereClause}
      ${finalStatusCondition}
      ORDER BY start_date DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [rows] = await db.execute(dataQuery, dataParams);

    return res.status(200).json({
      success: true,
      message:
        rows.length > 0
          ? "Berhasil mengambil data kejuaraan"
          : "Data kejuaraan masih kosong",
      data: rows,
      meta: {
        pagination: {
          current_page: page,
          per_page: limit,
          total_page: totalPages,
          total_data: totalData,
          has_next: page < totalPages,
          has_prev: page > 1,
        },
        summary: {
          total_championship: summary.total || 0,
          akan_datang: summary.akan_datang || 0,
          berlangsung: summary.berlangsung || 0,
          selesai: summary.selesai || 0,
        },
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server",
      error: error.message,
    });
  }
};
