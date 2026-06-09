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

    // Ambil summary
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

    const totalData = summary.total || 0;
    const totalPages = Math.ceil(totalData / limit);

    // 🔥 Ambil data
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
  LIMIT ${Number(limit)} OFFSET ${Number(offset)}
  `,
      [today, today, today],
    );

    return res.status(200).json({
      success: true,
      message:
        rows.length > 0
          ? "Berhasil mengambil data championship"
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
          total_championship: totalData,
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
      data: [],
      meta: null,
    });
  }
};
