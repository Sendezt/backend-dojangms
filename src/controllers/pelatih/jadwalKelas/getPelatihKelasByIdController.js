//src\controllers\pelatih\jadwalKelas\getPelatihKelasByIdController.js
const db = require("../../../config/database");
const ALLOWED_LIMITS = [10, 25, 50, 75, 100, 200];

exports.getPelatihKelasById = async (req, res) => {
  try {
    const pelatihId = req.user.id;
    const kelasId = parseInt(req.params.kelasId);

    if (isNaN(kelasId) || kelasId < 1) {
      return res.status(400).json({ message: "ID kelas tidak valid" });
    }

    // 1. Cek apakah pelatih mengampu kelas ini (status aktif)
    const [relasi] = await db.query(
      `SELECT id FROM kelas_pelatih 
       WHERE user_id = ? AND kelas_id = ? AND status = 'aktif'`,
      [pelatihId, kelasId],
    );
    if (relasi.length === 0) {
      return res.status(403).json({
        message:
          "Anda tidak memiliki akses ke kelas ini atau kelas tidak aktif",
      });
    }

    // 2. Ambil informasi kelas
    const [kelasRows] = await db.query(
      `SELECT id, nama, deskripsi, status, created_at
       FROM kelas WHERE id = ?`,
      [kelasId],
    );
    if (kelasRows.length === 0) {
      return res.status(404).json({ message: "Kelas tidak ditemukan" });
    }
    const kelas = kelasRows[0];

    // 3. Ambil daftar jadwal kelas (tipe = 'kelas', status aktif)
    const [jadwalRows] = await db.query(
      `SELECT id, nama, hari, jam_mulai, jam_selesai, lokasi, status
       FROM jadwal
       WHERE kelas_id = ? AND tipe = 'kelas' AND status = 'aktif'
       ORDER BY FIELD(hari, 'senin','selasa','rabu','kamis','jumat','sabtu','minggu'), jam_mulai`,
      [kelasId],
    );

    // 4. Pagination untuk daftar murid
    let page = parseInt(req.query.murid_page) || 1;
    let limit = parseInt(req.query.murid_limit) || 10;
    const searchMurid = req.query.search_murid?.trim() || null;

    if (!ALLOWED_LIMITS.includes(limit)) limit = 10;
    if (page < 1) page = 1;
    const offset = (page - 1) * limit;

    let whereMurid = [
      "km.kelas_id = ?",
      "km.status = 'aktif'",
      "u.status = 'active'",
    ];
    let muridParams = [kelasId];

    if (searchMurid) {
      whereMurid.push("(u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)");
      muridParams.push(
        `%${searchMurid}%`,
        `%${searchMurid}%`,
        `%${searchMurid}%`,
      );
    }

    const whereMuridClause = "WHERE " + whereMurid.join(" AND ");

    // Total murid
    const countMurid = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM kelas_murid km
      JOIN users u ON km.user_id = u.id
      ${whereMuridClause}
    `;
    const [[{ total: totalMurid }]] = await db.query(countMurid, muridParams);
    const totalMuridPages = Math.ceil(totalMurid / limit);

    // Daftar murid
    const muridQuery = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        km.tanggal_bergabung,
        b.id AS belt_id,
        b.name AS belt_name
      FROM kelas_murid km
      JOIN users u ON km.user_id = u.id
      LEFT JOIN user_belts ub ON ub.user_id = u.id AND ub.is_current = 1
      LEFT JOIN belts b ON ub.belt_id = b.id
      ${whereMuridClause}
      ORDER BY u.name ASC
      LIMIT ? OFFSET ?
    `;
    const muridParamsData = [...muridParams, limit, offset];
    const [muridRows] = await db.query(muridQuery, muridParamsData);

    const muridList = muridRows.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      phone: m.phone,
      tanggal_bergabung: m.tanggal_bergabung,
      sabuk: m.belt_id ? { id: m.belt_id, nama: m.belt_name } : null,
    }));

    // 5. Susun response
    const response = {
      id: kelas.id,
      nama: kelas.nama,
      deskripsi: kelas.deskripsi,
      status: kelas.status,
      created_at: kelas.created_at,
      jadwal: jadwalRows,
      murid: {
        total: totalMurid,
        data: muridList,
        pagination: {
          current_page: page,
          per_page: limit,
          total_page: totalMuridPages,
          has_next: page < totalMuridPages,
          has_prev: page > 1,
        },
      },
    };

    return res.status(200).json({
      success: true,
      message: "Detail kelas berhasil diambil",
      data: response,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil detail kelas",
      error: error.message,
    });
  }
};
