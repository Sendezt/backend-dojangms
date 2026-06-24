const db = require("../../../config/database");
const ALLOWED_LIMITS = [10, 25, 50, 75, 100, 200];

exports.getCalonPesertaKejuaraan = async (req, res) => {
  const { kejuaraanId, kelasKejuaraanId } = req.params;
  let { page = 1, limit = 10, search } = req.query;

  if (!kejuaraanId || isNaN(kejuaraanId)) {
    return res.status(400).json({ message: "ID kejuaraan tidak valid" });
  }
  if (!kelasKejuaraanId || isNaN(kelasKejuaraanId)) {
    return res.status(400).json({ message: "ID kelas kejuaraan tidak valid" });
  }

  let currentPage = parseInt(page);
  let perPage = parseInt(limit);
  if (!ALLOWED_LIMITS.includes(perPage)) perPage = 10;
  if (currentPage < 1) currentPage = 1;
  const offset = (currentPage - 1) * perPage;

  const conn = await db.getConnection();
  try {
    // 1. Ambil detail kelas kejuaraan
    const [kelasRows] = await conn.query(
      `SELECT tipe, kelas_id FROM kelas_kejuaraan WHERE id = ?`,
      [kelasKejuaraanId],
    );
    if (kelasRows.length === 0) {
      return res
        .status(404)
        .json({ message: "Kelas kejuaraan tidak ditemukan" });
    }
    const { tipe, kelas_id } = kelasRows[0];

    // 2. Ambil aturan usia untuk kejuaraan ini
    const [usiaRules] = await conn.query(
      `SELECT kategori_usia_id, tahun_lahir_min, tahun_lahir_max 
       FROM kejuaraan_kategori_usia 
       WHERE kejuaraan_id = ?`,
      [kejuaraanId],
    );
    if (usiaRules.length === 0) {
      return res
        .status(400)
        .json({ message: "Kejuaraan belum memiliki aturan usia" });
    }

    // 3. Tentukan kategori usia yang dibutuhkan
    let requiredKategoriUsiaId = null;
    if (tipe === "kyorugi") {
      const [ky] = await conn.query(
        `SELECT kategori_usia_id FROM kelas_kyorugi WHERE id = ?`,
        [kelas_id],
      );
      if (ky.length === 0)
        return res
          .status(400)
          .json({ message: "Data kelas kyorugi tidak valid" });
      requiredKategoriUsiaId = ky[0].kategori_usia_id;
    } else if (tipe === "poomsae") {
      const [po] = await conn.query(
        `SELECT kategori_usia_id FROM kelas_poomsae WHERE id = ?`,
        [kelas_id],
      );
      if (po.length === 0)
        return res
          .status(400)
          .json({ message: "Data kelas poomsae tidak valid" });
      requiredKategoriUsiaId = po[0].kategori_usia_id;
    } else {
      return res.status(400).json({ message: "Tipe kelas tidak dikenal" });
    }

    // 4. Dapatkan aturan untuk kategori usia tersebut
    const rule = usiaRules.find(
      (r) => r.kategori_usia_id === requiredKategoriUsiaId,
    );
    if (!rule) {
      return res.status(400).json({
        message: "Kejuaraan tidak memiliki aturan usia untuk kategori ini",
      });
    }

    // 5. Bangun kondisi usia (tanpa AND di dalam string)
    let usiaCondition = "";
    const usiaParams = [];
    if (rule.tahun_lahir_min !== null && rule.tahun_lahir_max !== null) {
      usiaCondition = "u.tahun_lahir BETWEEN ? AND ?";
      usiaParams.push(rule.tahun_lahir_min, rule.tahun_lahir_max);
    } else if (rule.tahun_lahir_min !== null) {
      usiaCondition = "u.tahun_lahir >= ?";
      usiaParams.push(rule.tahun_lahir_min);
    } else if (rule.tahun_lahir_max !== null) {
      usiaCondition = "u.tahun_lahir <= ?";
      usiaParams.push(rule.tahun_lahir_max);
    }

    // 6. Bangun WHERE utama
    let where = [
      "u.status = 'active'",
      "r.name = 'murid'",
      `NOT EXISTS (SELECT 1 FROM peserta_kejuaraan pk WHERE pk.user_id = u.id AND pk.kelas_kejuaraan_id = ?)`,
    ];
    let params = [kelasKejuaraanId, ...usiaParams];

    if (search && search.trim()) {
      where.push("(u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)");
      const like = `%${search.trim()}%`;
      params.push(like, like, like);
    }
    if (usiaCondition) {
      where.push(usiaCondition);
    }
    const whereClause = "WHERE " + where.join(" AND ");

    // 7. Hitung total calon
    const countQuery = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM users u
      JOIN user_roles ur ON ur.user_id = u.id
      JOIN roles r ON r.id = ur.role_id
      ${whereClause}
    `;
    const [[{ total }]] = await conn.query(countQuery, params);
    const totalPages = Math.ceil(total / perPage);

    // 8. Ambil data calon
    const dataQuery = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.tanggal_lahir,
        u.tahun_lahir,
        b.id AS belt_id,
        b.name AS belt_name,
        b.order_level AS belt_order
      FROM users u
      JOIN user_roles ur ON ur.user_id = u.id
      JOIN roles r ON r.id = ur.role_id
      LEFT JOIN user_belts ub ON ub.user_id = u.id AND ub.is_current = 1
      LEFT JOIN belts b ON ub.belt_id = b.id
      ${whereClause}
      ORDER BY u.name ASC
      LIMIT ? OFFSET ?
    `;
    const dataParams = [...params, perPage, offset];
    const [rows] = await conn.query(dataQuery, dataParams);

    const data = rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      tanggal_lahir: row.tanggal_lahir,
      tahun_lahir: row.tahun_lahir,
      sabuk_saat_ini: row.belt_id
        ? { id: row.belt_id, nama: row.belt_name, order: row.belt_order }
        : null,
    }));

    return res.status(200).json({
      success: true,
      message: data.length
        ? "Calon peserta ditemukan"
        : "Tidak ada calon peserta untuk kelas ini",
      data,
      meta: {
        pagination: {
          current_page: currentPage,
          per_page: perPage,
          total_page: totalPages,
          total_data: total,
          has_next: currentPage < totalPages,
          has_prev: currentPage > 1,
        },
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil calon peserta",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
