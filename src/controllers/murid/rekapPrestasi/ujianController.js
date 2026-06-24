const db = require("../../../config/database");
const ALLOWED_LIMITS = [10, 25, 50, 75, 100, 200];

/**
 * GET /api/user/riwayat-ujian
 * Menampilkan riwayat ujian sabuk yang pernah diikuti oleh murid,
 * lengkap dengan alur perjalanan sabuk.
 */
exports.getRiwayatUjianMurid = async (req, res) => {
  try {
    const userId = req.user.id;
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const statusFilter = req.query.status || null; // lulus / tidak_lulus / terdaftar

    if (!ALLOWED_LIMITS.includes(limit)) limit = 10;
    if (page < 1) page = 1;
    const offset = (page - 1) * limit;

    // 1. Ambil riwayat ujian dari peserta_ujian
    let where = ["pu.user_id = ?"];
    let params = [userId];

    if (
      statusFilter &&
      ["lulus", "tidak_lulus", "terdaftar"].includes(statusFilter)
    ) {
      where.push("pu.status = ?");
      params.push(statusFilter);
    }

    const whereClause = "WHERE " + where.join(" AND ");

    const countQuery = `
      SELECT COUNT(*) as total
      FROM peserta_ujian pu
      ${whereClause}
    `;
    const [[{ total }]] = await db.query(countQuery, params);
    const totalPages = Math.ceil(total / limit);

    const dataQuery = `
      SELECT
        pu.id AS peserta_ujian_id,
        pu.status,
        pu.tanggal_lulus,
        pu.tanggal_edit,
        u.id AS ujian_id,
        u.level_ujian,
        u.lokasi,
        u.keterangan,
        u.tanggal_mulai,
        u.tanggal_selesai,
        ba.name AS belt_asal_nama,
        bt.name AS belt_tujuan_nama,
        ba.id AS belt_asal_id,
        bt.id AS belt_tujuan_id
      FROM peserta_ujian pu
      JOIN ujian_sabuk u ON pu.ujian_id = u.id
      JOIN belts ba ON pu.belt_asal_id = ba.id
      JOIN belts bt ON pu.belt_tujuan_id = bt.id
      ${whereClause}
      ORDER BY u.tanggal_mulai DESC, u.tanggal_selesai DESC
      LIMIT ? OFFSET ?
    `;
    const dataParams = [...params, limit, offset];
    const [ujianRows] = await db.query(dataQuery, dataParams);

    // 2. Ambil alur sabuk (semua sabuk yang pernah dimiliki, urut berdasarkan achieved_at)
    const [beltRows] = await db.query(
      `SELECT 
         ub.id,
         ub.belt_id,
         b.name AS belt_name,
         ub.achieved_at,
         ub.is_current
       FROM user_belts ub
       JOIN belts b ON ub.belt_id = b.id
       WHERE ub.user_id = ?
       ORDER BY ub.achieved_at ASC`,
      [userId],
    );

    // Format data
    const riwayat = ujianRows.map((row) => ({
      peserta_ujian_id: row.peserta_ujian_id,
      ujian: {
        id: row.ujian_id,
        level: row.level_ujian,
        lokasi: row.lokasi,
        keterangan: row.keterangan,
        tanggal_mulai: row.tanggal_mulai,
        tanggal_selesai: row.tanggal_selesai,
      },
      status: row.status,
      tanggal_lulus: row.tanggal_lulus,
      tanggal_edit: row.tanggal_edit,
      belt_asal: { id: row.belt_asal_id, nama: row.belt_asal_nama },
      belt_tujuan: { id: row.belt_tujuan_id, nama: row.belt_tujuan_nama },
    }));

    const alurSabuk = beltRows.map((row) => ({
      id: row.id,
      belt_id: row.belt_id,
      nama: row.belt_name,
      achieved_at: row.achieved_at,
      is_current: row.is_current === 1,
    }));

    // 3. Hitung total ujian dan statistik kelulusan
    let totalUjian = ujianRows.length;
    let lulus = ujianRows.filter((r) => r.status === "lulus").length;
    let tidakLulus = ujianRows.filter((r) => r.status === "tidak_lulus").length;
    let terdaftar = ujianRows.filter((r) => r.status === "terdaftar").length;

    // 4. Current belt dari user_belts (is_current = 1)
    const currentBelt = beltRows.find((b) => b.is_current === 1);

    return res.status(200).json({
      success: true,
      message: "Berhasil mengambil riwayat ujian",
      data: {
        summary: {
          total_ujian: totalUjian,
          lulus: lulus,
          tidak_lulus: tidakLulus,
          terdaftar: terdaftar,
          sabuk_saat_ini: currentBelt
            ? {
                id: currentBelt.belt_id,
                nama: currentBelt.belt_name,
                achieved_at: currentBelt.achieved_at,
              }
            : null,
        },
        riwayat_ujian: riwayat,
        alur_sabuk: alurSabuk,
      },
      pagination: {
        current_page: page,
        per_page: limit,
        total_page: totalPages,
        total_data: total,
        has_next: page < totalPages,
        has_prev: page > 1,
      },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Gagal mengambil riwayat ujian",
        error: error.message,
      });
  }
};
