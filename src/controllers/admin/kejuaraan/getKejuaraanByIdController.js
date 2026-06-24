const db = require("../../../config/database");

/**
 * GET /api/admin/kejuaraan/:id
 * Mengembalikan detail kejuaraan + daftar kelas pertandingan + aturan usia per kategori
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

    // 2. Ambil aturan usia per kategori untuk kejuaraan ini
    const [usiaRules] = await conn.query(
      `SELECT kategori_usia_id, tahun_lahir_min, tahun_lahir_max
       FROM kejuaraan_kategori_usia
       WHERE kejuaraan_id = ?`,
      [kejuaraanId],
    );
    const aturanUsia = usiaRules.map((rule) => ({
      kategori_usia_id: rule.kategori_usia_id,
      tahun_lahir_min: rule.tahun_lahir_min,
      tahun_lahir_max: rule.tahun_lahir_max,
    }));

    // 3. Ambil semua kelas_kejuaraan yang terhubung
    const [kelasKejuaraan] = await conn.query(
      `SELECT id, tipe, kelas_id
       FROM kelas_kejuaraan
       WHERE kejuaraan_id = ?`,
      [kejuaraanId],
    );

    // 4. Loop setiap kelas, ambil detail dari tabel terkait
    const kelasList = [];
    for (const kk of kelasKejuaraan) {
      if (kk.tipe === "kyorugi") {
        // Detail kelas kyorugi (tanpa min_age/max_age)
        const [kyRows] = await conn.query(
          `SELECT 
             ky.id,
             ky.gender,
             ky.label,
             ky.batas_bawah,
             ky.batas_atas,
             ku.id AS kategori_usia_id,
             ku.name AS kategori_usia_nama,
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
              batas_bawah: ky.batas_bawah,
              batas_atas: ky.batas_atas,
              kategori_usia: {
                id: ky.kategori_usia_id,
                nama: ky.kategori_usia_nama,
              },
              level_kelas: {
                id: ky.level_kelas_id,
                nama: ky.level_kelas_nama,
              },
            },
          });
        }
      } else if (kk.tipe === "poomsae") {
        // Detail kelas poomsae dengan jurus dan format dari master
        const [poRows] = await conn.query(
          `SELECT 
             p.id,
             p.gender,
             p.jurus_id,
             pj.name AS jurus_nama,
             p.format_id,
             pf.name AS format_nama,
             ku.id AS kategori_usia_id,
             ku.name AS kategori_usia_nama,
             lk.id AS level_kelas_id,
             lk.name AS level_kelas_nama
           FROM kelas_poomsae p
           JOIN kategori_usia ku ON ku.id = p.kategori_usia_id
           JOIN level_kelas lk ON lk.id = p.level_kelas_id
           JOIN poomsae_jurus pj ON pj.id = p.jurus_id
           JOIN poomsae_format pf ON pf.id = p.format_id
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
              jurus: po.jurus_nama,
              format: po.format_nama,
              kategori_usia: {
                id: po.kategori_usia_id,
                nama: po.kategori_usia_nama,
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

    // 5. Format response akhir
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
        aturan_usia: aturanUsia,
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
