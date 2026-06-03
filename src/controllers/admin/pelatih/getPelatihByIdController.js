const db = require("../../../config/database");

exports.getPelatihById = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const pelatihId = parseInt(req.params.id);

    if (!pelatihId || isNaN(pelatihId) || pelatihId < 1) {
      return res.status(400).json({ message: "ID pelatih tidak valid" });
    }

    // ============================================
    // 1. AMBIL DATA PELATIH (BY ID)
    // ============================================
    const [[row]] = await conn.query(
      `
      SELECT
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
        u.updated_at,
        p.spesialisasi,
        p.sertifikasi,
        b.id   AS belt_id,
        b.name AS belt_name
      FROM users u
      JOIN user_roles ur ON ur.user_id = u.id
      JOIN roles r       ON r.id = ur.role_id AND r.name = 'pelatih'
      LEFT JOIN pelatih p     ON p.user_id = u.id
      LEFT JOIN user_belts ub ON ub.user_id = u.id AND ub.is_current = 1
      LEFT JOIN belts b       ON b.id = ub.belt_id
      WHERE u.id = ?
        AND u.status = 'active'
      LIMIT 1
      `,
      [pelatihId],
    );

    if (!row) {
      return res.status(404).json({
        message: "Pelatih tidak ditemukan",
      });
    }

    // ============================================
    // 2. AMBIL KELAS & JADWAL PELATIH INI
    // ============================================
    const [kelasList] = await conn.query(
      `
  SELECT
    k.id          AS kelas_id,
    k.nama        AS kelas_nama,
    k.status      AS kelas_status,
    j.id          AS jadwal_id,
    j.hari,
    j.jam_mulai,
    j.jam_selesai,
    j.lokasi,
    COUNT(DISTINCT km.user_id) AS jumlah_murid
  FROM kelas_pelatih kp
  JOIN kelas k ON k.id = kp.kelas_id
  LEFT JOIN jadwal_kelas j ON j.kelas_id = k.id
  LEFT JOIN kelas_murid km ON km.kelas_id = k.id AND km.status = 'aktif'
  WHERE kp.user_id = ?
    AND k.status = 'aktif'
  GROUP BY
    k.id, k.nama, k.status,
    j.id, j.hari, j.jam_mulai, j.jam_selesai, j.lokasi
  ORDER BY k.nama ASC, j.hari ASC, j.jam_mulai ASC
  `,
      [pelatihId],
    );

    // Susun kelas (gabung jadwal-jadwal per kelas)
    const kelasMap = {};
    for (const k of kelasList) {
      if (!kelasMap[k.kelas_id]) {
        kelasMap[k.kelas_id] = {
          id: k.kelas_id,
          nama: k.kelas_nama,
          status: k.kelas_status,
          jumlah_murid: k.jumlah_murid,
          jadwal: [],
        };
      }

      if (k.hari) {
        kelasMap[k.kelas_id].jadwal.push({
          hari: k.hari,
          jam_mulai: k.jam_mulai,
          jam_selesai: k.jam_selesai,
          lokasi: k.lokasi,
        });
      }
    }

    const kelasDiampu = Object.values(kelasMap);

    const totalMurid = kelasDiampu.reduce(
      (sum, k) => sum + (k.jumlah_murid || 0),
      0,
    );

    // ============================================
    // 3. FORMAT RESPONSE
    // ============================================
    const data = {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      foto: row.foto,
      jenis_kelamin: row.jenis_kelamin,
      alamat: row.alamat,
      tanggal_lahir: row.tanggal_lahir,
      tanggal_bergabung: row.created_at,
      status: row.status,
      updated_at: row.updated_at,
      pelatih: {
        spesialisasi: row.spesialisasi,
        sertifikasi: row.sertifikasi,
      },
      sabuk_saat_ini: row.belt_id
        ? { id: row.belt_id, name: row.belt_name }
        : null,
      kelas_diampu: kelasDiampu,
      total_murid: totalMurid,
    };

    return res.status(200).json({
      message: "Berhasil mengambil detail pelatih",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil detail pelatih",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
