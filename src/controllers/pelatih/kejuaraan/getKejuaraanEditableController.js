const db = require("../../../config/database");

exports.getKejuaraanEditable = async (req, res) => {
  try {
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    // Hitung batas H+1: hanya kejuaraan dengan end_date < hari ini - 1 hari
    const batasHPlus1 = new Date(now);
    batasHPlus1.setDate(batasHPlus1.getDate() - 1);
    const batasHPlus1Str = batasHPlus1.toISOString().split("T")[0];

    // Ambil kejuaraan yang end_date <= batasHPlus1 (sudah lewat H+1)
    // Dan memiliki setidaknya satu peserta dengan is_edited = 0
    const query = `
      SELECT 
        k.id,
        k.name,
        k.level,
        k.location,
        k.year,
        k.start_date,
        k.end_date,
        COUNT(pk.id) AS total_peserta,
        SUM(CASE WHEN pk.is_edited = 0 THEN 1 ELSE 0 END) AS peserta_belum_diedit
      FROM kejuaraan k
      LEFT JOIN kelas_kejuaraan kk ON kk.kejuaraan_id = k.id
      LEFT JOIN peserta_kejuaraan pk ON pk.kelas_kejuaraan_id = kk.id
      WHERE k.end_date <= ?
      GROUP BY k.id
      HAVING peserta_belum_diedit > 0
      ORDER BY k.end_date DESC
    `;
    const [rows] = await db.query(query, [batasHPlus1Str]);

    return res.status(200).json({
      success: true,
      message:
        rows.length === 0
          ? "Tidak ada kejuaraan yang dapat diedit"
          : "Berhasil mengambil daftar kejuaraan",
      data: rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil daftar kejuaraan",
      error: error.message,
    });
  }
};
