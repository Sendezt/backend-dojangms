const db = require("../../../config/database");

exports.getMuridCompositionByBelt = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const [rows] = await conn.query(`
      SELECT 
        b.name AS belt,
        COUNT(u.id) AS totalMurid
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON r.id = ur.role_id
      JOIN user_belts ub ON ub.user_id = u.id
      JOIN belts b ON b.id = ub.belt_id
      WHERE 
        r.name = 'murid'
        AND u.status = 'active'
        AND ub.is_current = true
      GROUP BY b.name
      ORDER BY totalMurid DESC
    `);

    if (rows.length === 0) {
      return res.status(200).json({
        message: "Belum ada data murid aktif berdasarkan sabuk",
        total: 0,
        data: [],
      });
    }

    const totalMuridAktif = rows.reduce((sum, row) => sum + row.totalMurid, 0);

    const dataWithPercentage = rows.map((row) => ({
      belt: row.belt,
      totalMurid: row.totalMurid,
      percentage: Number(((row.totalMurid / totalMuridAktif) * 100).toFixed(2)),
    }));

    res.status(200).json({
      message: "Berhasil mengambil komposisi murid aktif berdasarkan sabuk",
      totalMuridAktif,
      data: dataWithPercentage,
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil komposisi murid berdasarkan sabuk",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
