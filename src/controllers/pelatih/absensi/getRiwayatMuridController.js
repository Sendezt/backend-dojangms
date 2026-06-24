// src/controllers/pelatih/riwayat/getRiwayatMuridController.js
const db = require("../../../config/database");

exports.getRiwayatAbsensiMurid = async (req, res) => {
  try {
    const pelatihId = req.user.id;
    const userId = parseInt(req.params.userId);
    const jadwalId = req.query.jadwalId ? parseInt(req.query.jadwalId) : null;
    const startDate = req.query.start_date || null;
    const endDate = req.query.end_date || null;
    const limit = parseInt(req.query.limit) || 20;

    if (!userId || isNaN(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "ID murid tidak valid" });
    }

    // Cek apakah murid ini terdaftar di kelas yang diampu pelatih
    const [check] = await db.query(
      `
      SELECT 1
      FROM kelas_murid km
      JOIN kelas_pelatih kp ON kp.kelas_id = km.kelas_id
      WHERE km.user_id = ?
        AND kp.user_id = ?
        AND km.status = 'aktif'
        AND kp.status = 'aktif'
      LIMIT 1
      `,
      [userId, pelatihId],
    );
    if (check.length === 0) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Anda tidak memiliki akses ke riwayat murid ini",
        });
    }

    // Bangun query riwayat absensi
    let where = ["a.user_id = ?"];
    let params = [userId];

    if (jadwalId) {
      where.push("a.jadwal_id = ?");
      params.push(jadwalId);
    }
    if (startDate) {
      where.push("a.tanggal >= ?");
      params.push(startDate);
    }
    if (endDate) {
      where.push("a.tanggal <= ?");
      params.push(endDate);
    }

    const whereClause = where.join(" AND ");

    const query = `
      SELECT
        a.id,
        a.tanggal,
        a.status,
        a.catatan,
        a.dicatat_oleh,
        a.created_at,
        u.name AS nama_murid,
        j.id AS jadwal_id,
        j.nama AS jadwal_nama,
        j.hari AS hari_latihan,
        j.jam_mulai,
        j.jam_selesai,
        k.id AS kelas_id,
        k.nama AS kelas_nama
      FROM absensi a
      JOIN users u ON a.user_id = u.id
      JOIN jadwal j ON a.jadwal_id = j.id
      LEFT JOIN kelas k ON j.kelas_id = k.id
      WHERE ${whereClause}
      ORDER BY a.tanggal DESC, j.jam_mulai DESC
      LIMIT ?
    `;

    const [rows] = await db.query(query, [...params, limit]);

    // Hitung statistik
    let totalHadir = 0,
      totalIzin = 0,
      totalSakit = 0,
      totalAlpha = 0;
    rows.forEach((row) => {
      if (row.status === "hadir") totalHadir++;
      else if (row.status === "izin") totalIzin++;
      else if (row.status === "sakit") totalSakit++;
      else if (row.status === "alpha") totalAlpha++;
    });

    const namaMurid = rows.length > 0 ? rows[0].nama_murid : null;

    return res.status(200).json({
      success: true,
      message: "Riwayat absensi murid berhasil diambil",
      data: {
        user_id: userId,
        nama: namaMurid,
        statistik: {
          total_hadir: totalHadir,
          total_izin: totalIzin,
          total_sakit: totalSakit,
          total_alpha: totalAlpha,
          total_sesi: rows.length,
        },
        riwayat: rows,
      },
      meta: {
        limit,
      },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Gagal mengambil riwayat absensi",
        error: error.message,
      });
  }
};
