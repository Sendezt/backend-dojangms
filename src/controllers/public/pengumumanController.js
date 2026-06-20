const db = require("../../config/database");
const ALLOWED_LIMITS = [10, 25, 50, 75, 100, 200];

/**
 * GET /api/user/pengumuman
 * Daftar pengumuman untuk user login + status baca
 * Query: page, limit, search
 */
exports.getPengumumanByUser = async (req, res) => {
  try {
    const userId = req.user.id;
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim() || null;

    if (!ALLOWED_LIMITS.includes(limit)) limit = 10;
    if (page < 1) page = 1;
    const offset = (page - 1) * limit;

    // Role user
    const [roles] = await db.query(
      `SELECT r.name FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = ?`,
      [userId],
    );
    const userRoles = roles.map((r) => r.name);

    // Kelas user
    const [kelasMurid] = await db.query(
      `SELECT kelas_id FROM kelas_murid WHERE user_id = ? AND status = 'aktif'`,
      [userId],
    );
    const [kelasPelatih] = await db.query(
      `SELECT kelas_id FROM kelas_pelatih WHERE user_id = ? AND status = 'aktif'`,
      [userId],
    );
    const kelasIds = [
      ...new Set([
        ...kelasMurid.map((k) => k.kelas_id),
        ...kelasPelatih.map((k) => k.kelas_id),
      ]),
    ];

    const rolePlaceholder = userRoles.length > 0 ? userRoles : ["none"];
    const kelasPlaceholder = kelasIds.length > 0 ? kelasIds : [0];

    let searchCondition = "";
    let searchParams = [];
    if (search) {
      searchCondition = "AND (p.judul LIKE ? OR p.isi LIKE ?)";
      searchParams = [`%${search}%`, `%${search}%`];
    }

    // COUNT total
    const countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM pengumuman p
      WHERE p.status = 'terkirim'
        AND (p.tanggal_publish IS NULL OR p.tanggal_publish <= CURDATE())
        AND (
          p.target_type = 'global'
          OR (p.target_type = 'role' AND (p.target_role = 'semua' OR p.target_role IN (?)))
          OR (p.target_type = 'kelas' AND p.kelas_id IN (?))
          OR (p.target_type = 'individu' AND EXISTS (
            SELECT 1 FROM pengumuman_target_user ptu WHERE ptu.pengumuman_id = p.id AND ptu.user_id = ?
          ))
        )
        ${searchCondition}
    `;
    const countParams = [
      rolePlaceholder,
      kelasPlaceholder,
      userId,
      ...searchParams,
    ];
    const [[{ total }]] = await db.query(countQuery, countParams);
    const totalPages = Math.ceil(total / limit);

    // DATA dengan status baca dari notifikasi
    const dataQuery = `
      SELECT
        p.id,
        p.judul,
        p.isi,
        p.target_type,
        p.target_role,
        p.kelas_id,
        p.status,
        p.tanggal_publish,
        p.created_at,
        p.scheduled_at,
        u.name AS pembuat_nama,
        COALESCE(n.is_read, 0) AS sudah_dibaca,
        n.id AS notifikasi_id
      FROM pengumuman p
      LEFT JOIN users u ON p.dibuat_oleh = u.id
      LEFT JOIN notifikasi n ON n.referensi_id = p.id AND n.user_id = ? AND n.tipe = 'pengumuman'
      WHERE p.status = 'terkirim'
        AND (p.tanggal_publish IS NULL OR p.tanggal_publish <= CURDATE())
        AND (
          p.target_type = 'global'
          OR (p.target_type = 'role' AND (p.target_role = 'semua' OR p.target_role IN (?)))
          OR (p.target_type = 'kelas' AND p.kelas_id IN (?))
          OR (p.target_type = 'individu' AND EXISTS (
            SELECT 1 FROM pengumuman_target_user ptu WHERE ptu.pengumuman_id = p.id AND ptu.user_id = ?
          ))
        )
        ${searchCondition}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const dataParams = [
      userId,
      rolePlaceholder,
      kelasPlaceholder,
      userId,
      ...searchParams,
      limit,
      offset,
    ];
    const [rows] = await db.query(dataQuery, dataParams);

    return res.status(200).json({
      success: true,
      message:
        rows.length === 0
          ? "Tidak ada pengumuman"
          : "Berhasil mengambil daftar pengumuman",
      data: rows,
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
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil pengumuman",
      error: error.message,
    });
  }
};

/**
 * GET /api/user/pengumuman/belum-dibaca
 * Jumlah pengumuman belum dibaca (berdasarkan notifikasi tipe='pengumuman')
 */
exports.getBelumDibaca = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query(
      "SELECT COUNT(*) as total FROM notifikasi WHERE user_id = ? AND tipe = 'pengumuman' AND is_read = 0",
      [userId],
    );
    return res
      .status(200)
      .json({ success: true, data: { total: rows[0]?.total || 0 } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal menghitung",
      error: error.message,
    });
  }
};

/**
 * PUT /api/user/pengumuman/:id/baca
 * Tandai satu pengumuman sudah dibaca
 */
exports.tandaiBaca = async (req, res) => {
  try {
    const userId = req.user.id;
    const pengumumanId = parseInt(req.params.id);
    if (isNaN(pengumumanId) || pengumumanId < 1) {
      return res
        .status(400)
        .json({ success: false, message: "ID tidak valid" });
    }

    // Cek apakah pengumuman ada dan user berhak melihatnya (optional)
    // ... bisa ditambahkan validasi target

    // Cek apakah sudah ada notifikasi
    const [existing] = await db.query(
      "SELECT id FROM notifikasi WHERE user_id = ? AND referensi_id = ? AND tipe = 'pengumuman'",
      [userId, pengumumanId],
    );
    if (existing.length > 0) {
      // Update
      await db.query("UPDATE notifikasi SET is_read = 1 WHERE id = ?", [
        existing[0].id,
      ]);
    } else {
      // Insert baru (misal pengumuman lama tanpa notifikasi)
      const [pengumuman] = await db.query(
        "SELECT judul, isi FROM pengumuman WHERE id = ?",
        [pengumumanId],
      );
      if (pengumuman.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Pengumuman tidak ditemukan" });
      }
      await db.query(
        `INSERT INTO notifikasi (user_id, judul, pesan, tipe, referensi_id, is_read, created_at)
         VALUES (?, ?, ?, 'pengumuman', ?, 1, NOW())`,
        [userId, pengumuman[0].judul, pengumuman[0].isi, pengumumanId],
      );
    }

    return res
      .status(200)
      .json({ success: true, message: "Pengumuman ditandai sudah dibaca" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal memperbarui",
      error: error.message,
    });
  }
};

/**
 * PUT /api/user/pengumuman/baca-semua
 * Tandai semua pengumuman user sudah dibaca
 */
exports.tandaiBacaSemua = async (req, res) => {
  try {
    const userId = req.user.id;
    const [result] = await db.query(
      "UPDATE notifikasi SET is_read = 1 WHERE user_id = ? AND tipe = 'pengumuman' AND is_read = 0",
      [userId],
    );
    return res.status(200).json({
      success: true,
      message: `${result.affectedRows} pengumuman ditandai sudah dibaca`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal memperbarui",
      error: error.message,
    });
  }
};
