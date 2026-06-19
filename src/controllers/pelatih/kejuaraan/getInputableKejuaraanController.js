const db = require("../../../config/database");

exports.getInputableKejuaraan = async (req, res) => {
  try {
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    // Hitung H+1 dari hari ini untuk batas akhir (end_date + 1 hari)
    const endDatePlusOne = new Date(now);
    endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
    const endDatePlusOneStr = endDatePlusOne.toISOString().split("T")[0];

    // Ambil kejuaraan yang:
    // start_date <= hari ini <= end_date + 1 hari
    const query = `
      SELECT
        id,
        name,
        level,
        location,
        year,
        start_date,
        end_date,
        CASE
          WHEN start_date <= ? AND end_date >= ? THEN 'berlangsung'
          WHEN end_date < ? AND ? <= DATE_ADD(end_date, INTERVAL 1 DAY) THEN 'toleransi'
          ELSE 'selesai'
        END AS status_input
      FROM kejuaraan
      WHERE start_date <= ?
        AND DATE_ADD(end_date, INTERVAL 1 DAY) >= ?
      ORDER BY start_date DESC
    `;
    const [rows] = await db.query(query, [
      today,
      today,
      today,
      today,
      endDatePlusOneStr,
      today,
    ]);

    // Tambahkan informasi jumlah peserta
    for (const item of rows) {
      const [count] = await db.query(
        "SELECT COUNT(*) as total FROM peserta_kejuaraan pk JOIN kelas_kejuaraan kk ON pk.kelas_kejuaraan_id = kk.id WHERE kk.kejuaraan_id = ?",
        [item.id],
      );
      item.jumlah_peserta = count[0]?.total || 0;
    }

    return res.status(200).json({
      success: true,
      message:
        rows.length === 0
          ? "Tidak ada kejuaraan yang dapat diinput hasil"
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
