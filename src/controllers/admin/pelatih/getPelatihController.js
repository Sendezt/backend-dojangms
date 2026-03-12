const db = require("../../../config/database");

exports.getAllPelatih = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const allowedLimits = [10, 25, 50, 75, 100, 200];
    const allowedStatuses = ["active", "inactive", "suspended"];

    // ── query params ────────────────────────────────────────────────────────
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim() || null; // "budi" / null
    const status = req.query.status?.trim() || null; // "active" / "inactive" / "suspended" / null

    if (!allowedLimits.includes(limit)) limit = 10;
    if (page < 1) page = 1;

    const offset = (page - 1) * limit;

    // ── validasi status ─────────────────────────────────────────────────────
    const filteredStatus = allowedStatuses.includes(status) ? status : null;

    // ── bangun WHERE clause dinamis ─────────────────────────────────────────
    // Kondisi dasar: harus punya role 'pelatih'
    const whereClauses = [
      "EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id AND r.name = 'pelatih')",
    ];
    const whereParams = [];

    // Filter status (kalau tidak ada, default tampil semua status)
    if (filteredStatus) {
      whereClauses.push("u.status = ?");
      whereParams.push(filteredStatus);
    }

    // Filter search (cari di name, email, phone)
    if (search) {
      whereClauses.push("(u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)");
      const like = `%${search}%`;
      whereParams.push(like, like, like);
    }

    const whereSQL = "WHERE " + whereClauses.join(" AND ");

    // ============================================
    // 1. TOTAL DATA (pakai WHERE yang sama)
    // ============================================
    const [[totalData]] = await conn.query(
      `SELECT COUNT(DISTINCT u.id) AS total
       FROM users u
       ${whereSQL}`,
      whereParams,
    );

    const total = totalData.total;
    const totalPage = Math.max(Math.ceil(total / limit), 1);

    // ============================================
    // 2. AMBIL DATA PELATIH
    // ============================================
    const [rows] = await conn.query(
      `SELECT
         u.id,
         u.name,
         u.email,
         u.phone,
         u.foto,
         u.jenis_kelamin,
         u.alamat,
         u.tanggal_lahir,
         u.status,
         u.created_at,
         p.spesialisasi,
         p.sertifikasi,
         b.id   AS belt_id,
         b.name AS belt_name
       FROM users u
       LEFT JOIN pelatih p     ON p.user_id = u.id
       LEFT JOIN user_belts ub ON ub.user_id = u.id AND ub.is_current = 1
       LEFT JOIN belts b       ON b.id = ub.belt_id
       ${whereSQL}
       ORDER BY u.name ASC
       LIMIT ? OFFSET ?`,
      [...whereParams, limit, offset],
    );

    // ============================================
    // 3. AMBIL KELAS & JADWAL PER PELATIH
    // ============================================
    let kelasMap = {};

    if (rows.length > 0) {
      const pelatihIds = rows.map((r) => r.id);

      const [kelasList] = await conn.query(
        `SELECT
           k.id          AS kelas_id,
           k.nama        AS kelas_nama,
           k.status      AS kelas_status,
           k.pelatih_id,
           j.hari,
           j.jam_mulai,
           j.jam_selesai,
           j.lokasi,
           COUNT(DISTINCT km.user_id) AS jumlah_murid
         FROM kelas k
         LEFT JOIN jadwal_kelas j  ON j.kelas_id = k.id
         LEFT JOIN kelas_murid km  ON km.kelas_id = k.id AND km.status = 'aktif'
         WHERE k.pelatih_id IN (?)
           AND k.status = 'aktif'
         GROUP BY
           k.id, k.nama, k.status, k.pelatih_id,
           j.id, j.hari, j.jam_mulai, j.jam_selesai, j.lokasi`,
        [pelatihIds],
      );

      for (const row of kelasList) {
        const pid = row.pelatih_id;
        if (!kelasMap[pid]) kelasMap[pid] = {};

        if (!kelasMap[pid][row.kelas_id]) {
          kelasMap[pid][row.kelas_id] = {
            id: row.kelas_id,
            nama: row.kelas_nama,
            status: row.kelas_status,
            jumlah_murid: row.jumlah_murid,
            jadwal: [],
          };
        }

        if (row.hari) {
          kelasMap[pid][row.kelas_id].jadwal.push({
            hari: row.hari,
            jam_mulai: row.jam_mulai,
            jam_selesai: row.jam_selesai,
            lokasi: row.lokasi,
          });
        }
      }
    }

    // ============================================
    // 4. FORMAT DATA
    // ============================================
    const data = rows.map((pelatih) => {
      const kelasDiampu = kelasMap[pelatih.id]
        ? Object.values(kelasMap[pelatih.id])
        : [];

      const totalMurid = kelasDiampu.reduce(
        (sum, k) => sum + (k.jumlah_murid || 0),
        0,
      );

      return {
        id: pelatih.id,
        name: pelatih.name,
        email: pelatih.email,
        phone: pelatih.phone,
        foto: pelatih.foto,
        jenis_kelamin: pelatih.jenis_kelamin,
        alamat: pelatih.alamat,
        tanggal_lahir: pelatih.tanggal_lahir,
        tanggal_bergabung: pelatih.created_at,
        status: pelatih.status,
        pelatih: {
          spesialisasi: pelatih.spesialisasi,
          sertifikasi: pelatih.sertifikasi,
        },
        sabuk_saat_ini: pelatih.belt_id
          ? { id: pelatih.belt_id, name: pelatih.belt_name }
          : null,
        kelas_diampu: kelasDiampu,
        total_murid: totalMurid,
      };
    });

    // ============================================
    // 5. RESPONSE
    // ============================================
    return res.status(200).json({
      message:
        data.length === 0
          ? "Data pelatih masih kosong"
          : "Berhasil mengambil data pelatih",
      pagination: {
        page,
        limit,
        total_data: total,
        total_page: totalPage,
        has_next: page < totalPage,
        has_prev: page > 1,
      },
      data,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil data pelatih",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
