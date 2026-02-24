const db = require("../../../config/database");

exports.getMuridCompositionByAge = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const [rows] = await conn.query(`
      SELECT 
        ac.name AS kategoriUmur,
        ac.min_age,
        ac.max_age,
        COUNT(u.id) AS totalMurid
      FROM age_classes ac
      LEFT JOIN users u 
        ON TIMESTAMPDIFF(
            YEAR, 
            u.tanggal_lahir, 
            CONVERT_TZ(NOW(), '+00:00', '+07:00')
          ) BETWEEN ac.min_age AND ac.max_age
        AND u.status = 'active'
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id AND r.name = 'murid'
      WHERE r.name = 'murid'
      GROUP BY ac.id
      ORDER BY ac.min_age ASC
    `);

    if (rows.length === 0) {
      return res.status(200).json({
        message: "Belum ada data kategori umur",
        totalMuridAktif: 0,
        data: [],
      });
    }

    const totalMuridAktif = rows.reduce((sum, row) => sum + row.totalMurid, 0);

    const dataFormatted = rows.map((row) => ({
      kategoriUmur: row.kategoriUmur,
      rentang: `${row.min_age}-${row.max_age} tahun`,
      totalMurid: row.totalMurid,
      percentage:
        totalMuridAktif === 0
          ? 0
          : Number(((row.totalMurid / totalMuridAktif) * 100).toFixed(2)),
    }));

    res.status(200).json({
      message: "Berhasil mengambil komposisi murid berdasarkan kategori umur",
      totalMuridAktif,
      data: dataFormatted,
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil komposisi murid berdasarkan kategori umur",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
