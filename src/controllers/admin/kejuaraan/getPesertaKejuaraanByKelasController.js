const db = require("../../../config/database");
const ALLOWED_LIMITS = [10, 25, 50, 75, 100, 200];

exports.getPesertaKejuaraanByKelas = async (req, res) => {
  const { kelasKejuaraanId } = req.params;
  let { page = 1, limit = 10, search, hasil } = req.query;

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
    // 1. Ambil detail kelas kejuaraan (termasuk tipe, kelas_id, lalu detail dari kelas terkait)
    const [kelasRows] = await conn.query(
      `SELECT id, tipe, kelas_id FROM kelas_kejuaraan WHERE id = ?`,
      [kelasKejuaraanId],
    );
    if (kelasRows.length === 0) {
      return res
        .status(404)
        .json({ message: "Kelas kejuaraan tidak ditemukan" });
    }
    const kelasKejuaraan = kelasRows[0];
    const { tipe, kelas_id } = kelasKejuaraan;

    let detailKelas = null;
    if (tipe === "kyorugi") {
      const [ky] = await conn.query(
        `SELECT 
           ky.id, ky.gender, ky.label, ky.batas_bawah, ky.batas_atas,
           ku.id AS kategori_usia_id, ku.name AS kategori_usia_nama,
           lk.id AS level_kelas_id, lk.name AS level_kelas_nama
         FROM kelas_kyorugi ky
         JOIN kategori_usia ku ON ky.kategori_usia_id = ku.id
         JOIN level_kelas lk ON ky.level_kelas_id = lk.id
         WHERE ky.id = ?`,
        [kelas_id],
      );
      if (ky.length === 0) {
        return res
          .status(400)
          .json({ message: "Data kelas kyorugi tidak valid" });
      }
      const k = ky[0];
      detailKelas = {
        id: k.id,
        tipe: "kyorugi",
        gender: k.gender,
        label: k.label,
        batas_bawah: k.batas_bawah,
        batas_atas: k.batas_atas,
        kategori_usia: { id: k.kategori_usia_id, nama: k.kategori_usia_nama },
        level_kelas: { id: k.level_kelas_id, nama: k.level_kelas_nama },
      };
    } else if (tipe === "poomsae") {
      const [po] = await conn.query(
        `SELECT 
           p.id, p.gender, p.jurus_id, pj.name AS jurus_nama, p.format_id, pf.name AS format_nama,
           ku.id AS kategori_usia_id, ku.name AS kategori_usia_nama,
           lk.id AS level_kelas_id, lk.name AS level_kelas_nama
         FROM kelas_poomsae p
         JOIN poomsae_jurus pj ON p.jurus_id = pj.id
         JOIN poomsae_format pf ON p.format_id = pf.id
         JOIN kategori_usia ku ON p.kategori_usia_id = ku.id
         JOIN level_kelas lk ON p.level_kelas_id = lk.id
         WHERE p.id = ?`,
        [kelas_id],
      );
      if (po.length === 0) {
        return res
          .status(400)
          .json({ message: "Data kelas poomsae tidak valid" });
      }
      const p = po[0];
      detailKelas = {
        id: p.id,
        tipe: "poomsae",
        gender: p.gender,
        jurus: { id: p.jurus_id, nama: p.jurus_nama },
        format: { id: p.format_id, nama: p.format_nama },
        kategori_usia: { id: p.kategori_usia_id, nama: p.kategori_usia_nama },
        level_kelas: { id: p.level_kelas_id, nama: p.level_kelas_nama },
      };
    } else {
      return res.status(400).json({ message: "Tipe kelas tidak dikenal" });
    }

    // 2. Bangun WHERE clause untuk peserta
    let where = ["pk.kelas_kejuaraan_id = ?"];
    let params = [kelasKejuaraanId];

    if (search && search.trim()) {
      where.push("(u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)");
      const like = `%${search.trim()}%`;
      params.push(like, like, like);
    }
    if (
      hasil &&
      [
        "juara1",
        "juara2",
        "juara3",
        "harapan1",
        "harapan2",
        "peserta",
      ].includes(hasil)
    ) {
      where.push("pk.hasil = ?");
      params.push(hasil);
    }

    const whereClause = "WHERE " + where.join(" AND ");

    // 3. Hitung total peserta
    const countQuery = `
      SELECT COUNT(*) as total
      FROM peserta_kejuaraan pk
      JOIN users u ON pk.user_id = u.id
      ${whereClause}
    `;
    const [[{ total }]] = await conn.query(countQuery, params);
    const totalPages = Math.ceil(total / perPage);

    // 4. Ambil data peserta
    const dataQuery = `
      SELECT 
        pk.id,
        pk.user_id,
        pk.belt_id,
        pk.hasil,
        pk.catatan,
        pk.is_edited,
        u.name,
        u.email,
        u.phone,
        u.tanggal_lahir,
        u.tahun_lahir,
        b.name AS belt_name
      FROM peserta_kejuaraan pk
      JOIN users u ON pk.user_id = u.id
      LEFT JOIN belts b ON pk.belt_id = b.id
      ${whereClause}
      ORDER BY 
        FIELD(pk.hasil, 'juara1', 'juara2', 'juara3', 'harapan1', 'harapan2', 'peserta'),
        u.name ASC
      LIMIT ? OFFSET ?
    `;
    const dataParams = [...params, perPage, offset];
    const [rows] = await conn.query(dataQuery, dataParams);

    const pesertaList = rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      tanggal_lahir: row.tanggal_lahir,
      tahun_lahir: row.tahun_lahir,
      belt: row.belt_id ? { id: row.belt_id, nama: row.belt_name } : null,
      hasil: row.hasil,
      catatan: row.catatan,
      is_edited: row.is_edited === 1,
    }));

    return res.status(200).json({
      success: true,
      message: pesertaList.length
        ? "Berhasil mengambil daftar peserta"
        : "Belum ada peserta di kelas ini",
      kelas: detailKelas, // informasi detail kelas
      data: pesertaList,
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
      message: "Gagal mengambil daftar peserta",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
