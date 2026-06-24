const db = require("../../../config/database");
const ALLOWED_LIMITS = [10, 25, 50, 75, 100, 200];

// src/controllers/pelatih/absensiHistoryController.js (modifikasi)

exports.getAbsensiHistory = async (req, res) => {
  try {
    const pelatihId = req.user.id;
    const jadwalId = parseInt(req.params.jadwalId);
    const filter = req.query.filter; // 'editable' atau undefined

    if (isNaN(jadwalId) || jadwalId < 1) {
      return res
        .status(400)
        .json({ success: false, message: "ID jadwal tidak valid" });
    }

    // Cek akses pelatih
    const [jadwalCheck] = await db.query(
      `SELECT j.id, j.kelas_id, j.nama AS jadwal_nama
       FROM jadwal j
       JOIN kelas_pelatih kp ON kp.kelas_id = j.kelas_id
       WHERE j.id = ? AND kp.user_id = ? AND kp.status = 'aktif' AND j.tipe = 'kelas'`,
      [jadwalId, pelatihId],
    );
    if (jadwalCheck.length === 0) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Jadwal tidak ditemukan atau akses ditolak",
        });
    }
    const jadwal = jadwalCheck[0];

    // Pagination
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    if (!ALLOWED_LIMITS.includes(limit)) limit = 10;
    if (page < 1) page = 1;
    const offset = (page - 1) * limit;

    // Filter tanggal
    let params = [jadwalId];
    let dateFilter = "AND tanggal <= CURDATE()"; // hanya sesi yang sudah lewat atau hari ini

    // Jika filter=editable, batasi tanggal >= 7 hari yang lalu
    if (filter === "editable") {
      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const batasTanggal = sevenDaysAgo.toISOString().split("T")[0];
      dateFilter += " AND tanggal >= ?";
      params.push(batasTanggal);
    }

    // Jika ada tanggal_akhir dari query
    if (req.query.tanggal_akhir) {
      const tglAkhir = req.query.tanggal_akhir;
      if (isNaN(Date.parse(tglAkhir))) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Format tanggal_akhir tidak valid",
          });
      }
      dateFilter += " AND tanggal <= ?";
      params.push(tglAkhir);
    }

    // Total sesi
    const countQuery = `
      SELECT COUNT(DISTINCT tanggal) as total
      FROM absensi
      WHERE jadwal_id = ?
      ${dateFilter}
    `;
    const [[{ total }]] = await db.query(countQuery, params);
    const totalPages = Math.ceil(total / limit);

    // Data history per tanggal
    const dataQuery = `
      SELECT 
        tanggal,
        COUNT(*) AS total_murid,
        SUM(CASE WHEN status = 'hadir' THEN 1 ELSE 0 END) AS hadir,
        SUM(CASE WHEN status = 'izin' THEN 1 ELSE 0 END) AS izin,
        SUM(CASE WHEN status = 'sakit' THEN 1 ELSE 0 END) AS sakit,
        SUM(CASE WHEN status = 'alpha' THEN 1 ELSE 0 END) AS alpha
      FROM absensi
      WHERE jadwal_id = ?
      ${dateFilter}
      GROUP BY tanggal
      ORDER BY tanggal DESC
      LIMIT ? OFFSET ?
    `;
    const dataParams = [...params, limit, offset];
    const [rows] = await db.query(dataQuery, dataParams);

    const history = rows.map((row) => ({
      tanggal: row.tanggal,
      total_murid: row.total_murid,
      hadir: row.hadir,
      izin: row.izin,
      sakit: row.sakit,
      alpha: row.alpha,
      persentase_hadir:
        row.total_murid > 0
          ? Math.round((row.hadir / row.total_murid) * 100)
          : 0,
    }));

    return res.status(200).json({
      success: true,
      message: "Berhasil mengambil history absensi",
      data: {
        jadwal_id: jadwalId,
        jadwal_nama: jadwal.jadwal_nama,
        filter_editable: filter === "editable" ? true : false,
        history,
      },
      meta: {
        pagination: {
          current_page: page,
          per_page: limit,
          total_page: totalPages,
          total_data: total,
          has_next: page < totalPages,
          has_prev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Gagal mengambil history absensi",
        error: error.message,
      });
  }
};
