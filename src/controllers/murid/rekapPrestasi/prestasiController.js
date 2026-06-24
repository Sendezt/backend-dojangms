const db = require("../../../config/database");
const ALLOWED_LIMITS = [10, 25, 50, 75, 100, 200];

exports.getPrestasiMurid = async (req, res) => {
  try {
    const userId = req.user.id;

    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim() || null;
    const tahun = req.query.tahun ? parseInt(req.query.tahun) : null;
    const level = req.query.level || null;
    const hasil = req.query.hasil || null;

    if (!ALLOWED_LIMITS.includes(limit)) limit = 10;
    if (page < 1) page = 1;
    const offset = (page - 1) * limit;

    // Filter: hanya ambil hasil yang bukan 'peserta'
    let where = [
      "pk.user_id = ?",
      "pk.hasil IS NOT NULL",
      "pk.hasil != 'peserta'",
    ];
    let params = [userId];

    if (search) {
      where.push("(k.name LIKE ? OR k.location LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }
    if (tahun) {
      where.push("k.year = ?");
      params.push(tahun);
    }
    if (
      level &&
      ["kota", "provinsi", "nasional", "internasional"].includes(level)
    ) {
      where.push("k.level = ?");
      params.push(level);
    }
    if (
      hasil &&
      ["juara1", "juara2", "juara3", "harapan1", "harapan2"].includes(hasil)
    ) {
      where.push("pk.hasil = ?");
      params.push(hasil);
    }

    const whereClause = "WHERE " + where.join(" AND ");

    // Count total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM peserta_kejuaraan pk
      JOIN kelas_kejuaraan kk ON pk.kelas_kejuaraan_id = kk.id
      JOIN kejuaraan k ON kk.kejuaraan_id = k.id
      ${whereClause}
    `;
    const [[{ total }]] = await db.query(countQuery, params);
    const totalPages = Math.ceil(total / limit);

    // Ambil data prestasi
    const dataQuery = `
      SELECT
        k.id AS kejuaraan_id,
        k.name AS kejuaraan_nama,
        k.level,
        k.location,
        k.year,
        k.start_date,
        k.end_date,
        kk.tipe AS cabang,
        pk.hasil,
        pk.catatan,
        pk.is_edited,
        b.name AS belt_saat_itu,
        ku.name AS kategori_usia,
        lk.name AS level_kompetisi,
        CASE 
          WHEN kk.tipe = 'kyorugi' THEN ky.gender
          WHEN kk.tipe = 'poomsae' THEN po.gender
        END AS gender,
        CASE 
          WHEN kk.tipe = 'kyorugi' THEN ky.label
          ELSE NULL
        END AS label_berat,
        CASE 
          WHEN kk.tipe = 'kyorugi' THEN ky.batas_bawah
          ELSE NULL
        END AS batas_bawah,
        CASE 
          WHEN kk.tipe = 'kyorugi' THEN ky.batas_atas
          ELSE NULL
        END AS batas_atas,
        CASE 
          WHEN kk.tipe = 'poomsae' THEN pj.name
          ELSE NULL
        END AS jurus,
        CASE 
          WHEN kk.tipe = 'poomsae' THEN pf.name
          ELSE NULL
        END AS format_poomsae,
        COALESCE(
          CASE 
            WHEN kk.tipe = 'kyorugi' THEN CONCAT(ku.name, ' ', lk.name, ' ', ky.label, ' ', ky.gender)
            WHEN kk.tipe = 'poomsae' THEN CONCAT(ku.name, ' ', lk.name, ' ', pj.name, ' (', pf.name, ') ', po.gender)
          END,
          'Detail tidak tersedia'
        ) AS kelas_kejuaraan_detail
      FROM peserta_kejuaraan pk
      JOIN kelas_kejuaraan kk ON pk.kelas_kejuaraan_id = kk.id
      JOIN kejuaraan k ON kk.kejuaraan_id = k.id
      JOIN belts b ON pk.belt_id = b.id
      LEFT JOIN kelas_kyorugi ky ON kk.tipe = 'kyorugi' AND kk.kelas_id = ky.id
      LEFT JOIN kelas_poomsae po ON kk.tipe = 'poomsae' AND kk.kelas_id = po.id
      LEFT JOIN kategori_usia ku ON ku.id = COALESCE(ky.kategori_usia_id, po.kategori_usia_id)
      LEFT JOIN level_kelas lk ON lk.id = COALESCE(ky.level_kelas_id, po.level_kelas_id)
      LEFT JOIN poomsae_jurus pj ON po.jurus_id = pj.id
      LEFT JOIN poomsae_format pf ON po.format_id = pf.id
      ${whereClause}
      ORDER BY 
        CASE 
          WHEN pk.hasil = 'juara1' THEN 1
          WHEN pk.hasil = 'juara2' THEN 2
          WHEN pk.hasil = 'juara3' THEN 3
          WHEN pk.hasil = 'harapan1' THEN 4
          WHEN pk.hasil = 'harapan2' THEN 5
          ELSE 6
        END ASC,
        k.end_date DESC,
        k.start_date DESC
      LIMIT ? OFFSET ?
    `;
    const dataParams = [...params, limit, offset];
    const [rows] = await db.query(dataQuery, dataParams);

    return res.status(200).json({
      success: true,
      message:
        rows.length === 0
          ? "Belum ada prestasi"
          : "Berhasil mengambil daftar prestasi",
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
    return res
      .status(500)
      .json({
        success: false,
        message: "Gagal mengambil prestasi",
        error: error.message,
      });
  }
};
