// controllers/admin/pelatih/getPelatihCounts.js
const db = require("../../../config/database");

exports.getPelatihCounts = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const [rows] = await conn.query(`
      SELECT
        u.status,
        COUNT(DISTINCT u.id) AS total
      FROM users u
      WHERE EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = u.id AND r.name = 'pelatih'
      )
      GROUP BY u.status
    `);

    // rows = [{ status: 'active', total: 10 }, { status: 'inactive', total: 3 }]
    const counts = { total: 0, active: 0, inactive: 0, suspended: 0 };

    for (const row of rows) {
      const n = Number(row.total);
      counts[row.status] = n;
      counts.total += n;
    }

    return res.status(200).json({ data: counts });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil jumlah pelatih",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
