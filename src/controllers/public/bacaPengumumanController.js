const db = require("../../config/database");
/**
 * GET /api/user/pengumuman/:id
 * Detail satu pengumuman, dengan validasi akses user.
 * Otomatis menandai sudah dibaca (opsional, bisa diaktifkan).
 */
exports.getDetailPengumuman = async (req, res) => {
  try {
    const userId = req.user.id;
    const pengumumanId = parseInt(req.params.id);
    if (isNaN(pengumumanId) || pengumumanId < 1) {
      return res
        .status(400)
        .json({ success: false, message: "ID pengumuman tidak valid" });
    }

    // Ambil role dan kelas user (sama seperti di getPengumumanByUser)
    const [roles] = await db.query(
      `SELECT r.name FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = ?`,
      [userId],
    );
    const userRoles = roles.map((r) => r.name);

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

    // Query detail pengumuman dengan validasi akses
    const query = `
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
      WHERE p.id = ?
        AND p.status = 'terkirim'
        AND (p.tanggal_publish IS NULL OR p.tanggal_publish <= CURDATE())
        AND (
          p.target_type = 'global'
          OR (p.target_type = 'role' AND (p.target_role = 'semua' OR p.target_role IN (?)))
          OR (p.target_type = 'kelas' AND p.kelas_id IN (?))
          OR (p.target_type = 'individu' AND EXISTS (
            SELECT 1 FROM pengumuman_target_user ptu WHERE ptu.pengumuman_id = p.id AND ptu.user_id = ?
          ))
        )
      LIMIT 1
    `;
    const rolePlaceholder = userRoles.length > 0 ? userRoles : ["none"];
    const kelasPlaceholder = kelasIds.length > 0 ? kelasIds : [0];
    const params = [
      userId,
      pengumumanId,
      rolePlaceholder,
      kelasPlaceholder,
      userId,
    ];
    const [rows] = await db.query(query, params);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pengumuman tidak ditemukan atau Anda tidak memiliki akses",
      });
    }

    const pengumuman = rows[0];

    // (Opsional) Tandai sudah dibaca secara otomatis saat user melihat detail
    if (!pengumuman.sudah_dibaca) {
      // Cek apakah ada notifikasi, jika tidak buat baru lalu tandai baca
      const [existing] = await db.query(
        "SELECT id FROM notifikasi WHERE user_id = ? AND referensi_id = ? AND tipe = 'pengumuman'",
        [userId, pengumumanId],
      );
      if (existing.length > 0) {
        await db.query("UPDATE notifikasi SET is_read = 1 WHERE id = ?", [
          existing[0].id,
        ]);
      } else {
        await db.query(
          `INSERT INTO notifikasi (user_id, judul, pesan, tipe, referensi_id, is_read, created_at)
           VALUES (?, ?, ?, 'pengumuman', ?, 1, NOW())`,
          [userId, pengumuman.judul, pengumuman.isi, pengumumanId],
        );
      }
      // Refresh is_read di response
      pengumuman.sudah_dibaca = 1;
    }

    return res.status(200).json({
      success: true,
      message: "Berhasil mengambil detail pengumuman",
      data: pengumuman,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil detail pengumuman",
      error: error.message,
    });
  }
};
