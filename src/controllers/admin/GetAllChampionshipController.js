const getJakartaNow = () => {
  return new Date(
    new Date().toLocaleDateString("en-US", { timeZone: "Asia/Jakarta" }),
  );
};
const db = require("../../config/database");

const ALLOWED_LIMITS = [10, 25, 50, 75, 100, 200];

exports.getAllChampionships = async (req, res) => {
  try {
    const today = getJakartaNow();

    // Pagination params
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const requestedLimit = parseInt(req.query.limit) || 10;
    const limit = ALLOWED_LIMITS.includes(requestedLimit) ? requestedLimit : 10;
    const offset = (page - 1) * limit;

    // Count total + summary per status
    const [[summary]] = await db.execute(
      `
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN start_date > ? THEN 1 ELSE 0 END) AS akan_datang,
        SUM(CASE WHEN start_date <= ? AND end_date >= ? THEN 1 ELSE 0 END) AS berlangsung,
        SUM(CASE WHEN end_date < ? THEN 1 ELSE 0 END) AS selesai
      FROM kejuaraan
      `,
      [today, today, today, today],
    );

    const totalPages = Math.ceil(summary.total / limit);

    const [rows] = await db.execute(
      `
      SELECT 
        id,
        name,
        level,
        location,
        start_date,
        end_date,
        CASE
          WHEN start_date > ? THEN 'akan datang'
          WHEN start_date <= ? AND end_date >= ? THEN 'berlangsung'
          ELSE 'selesai'
        END AS status
      FROM kejuaraan
      ORDER BY start_date DESC
      LIMIT ${limit} OFFSET ${offset}
    `,
      [today, today, today],
    );

    if (rows.length === 0) {
      return res.status(200).json({
        message: "Data kejuaraan masih kosong",
        summary: {
          total: summary.total,
          akan_datang: summary.akan_datang,
          berlangsung: summary.berlangsung,
          selesai: summary.selesai,
        },
        data: [],
        pagination: {
          total: summary.total,
          page,
          limit,
          totalPages,
        },
      });
    }

    res.status(200).json({
      message: "Berhasil mengambil data championship",
      summary: {
        total: summary.total,
        akan_datang: summary.akan_datang,
        berlangsung: summary.berlangsung,
        selesai: summary.selesai,
      },
      data: rows,
      pagination: {
        total: summary.total,
        page,
        limit,
        totalPages,
        allowedLimits: ALLOWED_LIMITS,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Terjadi kesalahan pada server",
    });
  }
};
