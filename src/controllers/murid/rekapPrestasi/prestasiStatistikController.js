const db = require("../../../config/database");
/**
 * GET /api/user/prestasi/statistik
 * Ringkasan statistik prestasi murid
 */
exports.getStatistikPrestasi = async (req, res) => {
  try {
    const userId = req.user.id;

    // Ambil semua hasil yang sudah terisi
    const [rows] = await db.query(
      `SELECT hasil FROM peserta_kejuaraan WHERE user_id = ? AND hasil IS NOT NULL`,
      [userId]
    );

    const statistik = {
      total_kejuaraan: rows.length,
      juara1: 0,
      juara2: 0,
      juara3: 0,
      harapan1: 0,
      harapan2: 0,
      peserta: 0,
    };

    rows.forEach(row => {
      if (statistik.hasOwnProperty(row.hasil)) {
        statistik[row.hasil] += 1;
      }
    });

    return res.status(200).json({
      success: true,
      data: statistik,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Gagal mengambil statistik prestasi", error: error.message });
  }
};