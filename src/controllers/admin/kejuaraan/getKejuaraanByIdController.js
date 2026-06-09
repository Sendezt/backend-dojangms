const db = require("../../../config/database");

/**
 * GET /api/admin/kejuaraan/:id
 * Mengembalikan detail kejuaraan + daftar kelas pertandingan (kyorugi/poomsae)
 */
exports.getKejuaraanById = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const kejuaraanId = parseInt(req.params.id);
    if (!kejuaraanId || isNaN(kejuaraanId) || kejuaraanId < 1) {
      return res.status(400).json({ message: "ID kejuaraan tidak valid" });
    }

    // 1. Ambil data utama kejuaraan
    const [[kejuaraan]] = await conn.query(
      `SELECT id, name, level, location, year, start_date, end_date
       FROM kejuaraan
       WHERE id = ?`,
      [kejuaraanId],
    );
    if (!kejuaraan) {
      return res.status(404).json({ message: "Kejuaraan tidak ditemukan" });
    }

    // 2. Ambil semua kelas_kejuaraan yang terhubung
    const [kelasKejuaraan] = await conn.query(
      `SELECT id, tipe, kelas_id
       FROM kelas_kejuaraan
       WHERE kejuaraan_id = ?`,
      [kejuaraanId],
    );

    // 3. Loop setiap kelas, ambil detail dari tabel terkait
    const kelasList = [];
    for (const kk of kelasKejuaraan) {
      if (kk.tipe === "kyorugi") {
        // Ambil detail dari kelas_kyorugi lengkap dengan kategori usia dan level
        const [kyRows] = await conn.query(
          `SELECT 
             ky.id,
             ky.gender,
             ky.label,
             ky.batas_berat,
             ku.id AS kategori_usia_id,
             ku.name AS kategori_usia_nama,
             ku.min_age,
             ku.max_age,
             lk.id AS level_kelas_id,
             lk.name AS level_kelas_nama
           FROM kelas_kyorugi ky
           JOIN kategori_usia ku ON ku.id = ky.kategori_usia_id
           JOIN level_kelas lk ON lk.id = ky.level_kelas_id
           WHERE ky.id = ?`,
          [kk.kelas_id],
        );
        if (kyRows.length > 0) {
          const ky = kyRows[0];
          kelasList.push({
            id: kk.id, // id dari kelas_kejuaraan
            tipe: "kyorugi",
            kelas_id: ky.id,
            detail: {
              gender: ky.gender,
              label: ky.label,
              batas_berat: ky.batas_berat,
              kategori_usia: {
                id: ky.kategori_usia_id,
                nama: ky.kategori_usia_nama,
                min_age: ky.min_age,
                max_age: ky.max_age,
              },
              level_kelas: {
                id: ky.level_kelas_id,
                nama: ky.level_kelas_nama,
              },
            },
          });
        }
      } else if (kk.tipe === "poomsae") {
        const [poRows] = await conn.query(
          `SELECT 
             p.id,
             p.gender,
             p.jurus,
             p.format,
             ku.id AS kategori_usia_id,
             ku.name AS kategori_usia_nama,
             ku.min_age,
             ku.max_age,
             lk.id AS level_kelas_id,
             lk.name AS level_kelas_nama
           FROM kelas_poomsae p
           JOIN kategori_usia ku ON ku.id = p.kategori_usia_id
           JOIN level_kelas lk ON lk.id = p.level_kelas_id
           WHERE p.id = ?`,
          [kk.kelas_id],
        );
        if (poRows.length > 0) {
          const po = poRows[0];
          kelasList.push({
            id: kk.id,
            tipe: "poomsae",
            kelas_id: po.id,
            detail: {
              gender: po.gender,
              jurus: po.jurus,
              format: po.format,
              kategori_usia: {
                id: po.kategori_usia_id,
                nama: po.kategori_usia_nama,
                min_age: po.min_age,
                max_age: po.max_age,
              },
              level_kelas: {
                id: po.level_kelas_id,
                nama: po.level_kelas_nama,
              },
            },
          });
        }
      }
    }

    // 4. Format response akhir
    const response = {
      message: "Berhasil mengambil detail kejuaraan",
      data: {
        id: kejuaraan.id,
        name: kejuaraan.name,
        level: kejuaraan.level,
        location: kejuaraan.location,
        year: kejuaraan.year,
        start_date: kejuaraan.start_date,
        end_date: kejuaraan.end_date,
        kelas_pertandingan: kelasList,
      },
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal mengambil detail kejuaraan",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
