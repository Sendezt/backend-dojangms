const db = require("../../../config/database");

exports.createKejuaraan = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { name, level, location, start_date, end_date, kategori_usia_rules } =
      req.body;

    // Validasi dasar kejuaraan
    if (!name || typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({ message: "Nama kejuaraan wajib diisi" });
    }
    if (
      !level ||
      !["kota", "provinsi", "nasional", "internasional"].includes(level)
    ) {
      return res.status(400).json({ message: "Level kejuaraan tidak valid" });
    }
    if (!start_date || isNaN(new Date(start_date).getTime())) {
      return res.status(400).json({ message: "Tanggal mulai tidak valid" });
    }
    if (!end_date || isNaN(new Date(end_date).getTime())) {
      return res.status(400).json({ message: "Tanggal selesai tidak valid" });
    }

    const start = new Date(start_date);
    const end = new Date(end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      return res.status(400).json({
        message:
          "Tanggal mulai kejuaraan tidak boleh kurang dari tanggal hari ini",
      });
    }
    if (end < start) {
      return res.status(400).json({
        message: "Tanggal selesai harus setelah atau sama dengan tanggal mulai",
      });
    }

    const finalYear = start.getFullYear();
    const locationValue =
      location && typeof location === "string" ? location.trim() : null;

    // Validasi duplikat & overlap
    let query = `SELECT id FROM kejuaraan WHERE start_date = ? AND end_date = ?`;
    let params = [start_date, end_date];
    if (locationValue === null) {
      query += ` AND location IS NULL`;
    } else {
      query += ` AND location = ?`;
      params.push(locationValue);
    }
    const [existing] = await conn.query(query, params);
    if (existing.length > 0) {
      return res.status(409).json({
        message: `Sudah ada kejuaraan pada tanggal ${start_date} s.d ${end_date} di lokasi ${locationValue || "tidak ditentukan"}. Tidak boleh duplikat.`,
      });
    }

    let overlapQuery = `
      SELECT id, name, start_date, end_date FROM kejuaraan
      WHERE start_date <= ? AND end_date >= ?
    `;
    let overlapParams = [end_date, start_date];
    if (locationValue === null) {
      overlapQuery += ` AND location IS NULL`;
    } else {
      overlapQuery += ` AND location = ?`;
      overlapParams.push(locationValue);
    }
    const [conflict] = await conn.query(overlapQuery, overlapParams);
    if (conflict.length > 0) {
      const c = conflict[0];
      return res.status(409).json({
        message: `Tidak dapat membuat kejuaraan karena bentrok dengan kejuaraan "${c.name}" pada tanggal ${c.start_date} s.d ${c.end_date} di lokasi yang sama.`,
      });
    }

    // Validasi kategori_usia_rules
    if (
      !kategori_usia_rules ||
      !Array.isArray(kategori_usia_rules) ||
      kategori_usia_rules.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "Harus menyertakan aturan kategori usia" });
    }

    const [allKategori] = await conn.query("SELECT id FROM kategori_usia");
    const validKategoriIds = allKategori.map((k) => k.id);
    const usedKategoriIds = new Set();

    for (const rule of kategori_usia_rules) {
      const { kategori_usia_id, tahun_lahir_min, tahun_lahir_max } = rule;

      if (!validKategoriIds.includes(kategori_usia_id)) {
        return res.status(400).json({
          message: `Kategori usia ID ${kategori_usia_id} tidak valid`,
        });
      }
      if (usedKategoriIds.has(kategori_usia_id)) {
        return res.status(400).json({
          message: `Kategori usia ID ${kategori_usia_id} hanya boleh didefinisikan sekali`,
        });
      }
      usedKategoriIds.add(kategori_usia_id);

      // Pastikan setidaknya salah satu (min atau max) diisi
      const hasMin =
        tahun_lahir_min !== undefined &&
        tahun_lahir_min !== null &&
        tahun_lahir_min !== "";
      const hasMax =
        tahun_lahir_max !== undefined &&
        tahun_lahir_max !== null &&
        tahun_lahir_max !== "";
      if (!hasMin && !hasMax) {
        return res.status(400).json({
          message: `Untuk kategori usia ${kategori_usia_id}, harus mengisi minimal tahun_lahir_min atau tahun_lahir_max`,
        });
      }

      // Validasi min
      let minYear = null;
      if (hasMin) {
        minYear = parseInt(tahun_lahir_min);
        if (isNaN(minYear)) {
          return res.status(400).json({
            message: `Tahun lahir minimal untuk kategori usia ${kategori_usia_id} harus berupa angka`,
          });
        }
        if (minYear < 1900 || minYear > new Date().getFullYear() + 5) {
          return res.status(400).json({
            message: `Tahun lahir minimal tidak valid untuk kategori usia ${kategori_usia_id}`,
          });
        }
      }

      // Validasi max
      let maxYear = null;
      if (hasMax) {
        maxYear = parseInt(tahun_lahir_max);
        if (isNaN(maxYear)) {
          return res.status(400).json({
            message: `Tahun lahir maksimal untuk kategori usia ${kategori_usia_id} harus berupa angka`,
          });
        }
        if (maxYear < 1900 || maxYear > new Date().getFullYear() + 5) {
          return res.status(400).json({
            message: `Tahun lahir maksimal tidak valid untuk kategori usia ${kategori_usia_id}`,
          });
        }
      }

      // Jika keduanya diisi, pastikan min <= max
      if (hasMin && hasMax && minYear > maxYear) {
        return res.status(400).json({
          message: `Tahun lahir minimal harus <= tahun lahir maksimal untuk kategori usia ${kategori_usia_id}`,
        });
      }
    }

    await conn.beginTransaction();

    // Insert kejuaraan
    const [result] = await conn.query(
      `INSERT INTO kejuaraan (name, level, location, year, start_date, end_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name.trim(), level, locationValue, finalYear, start_date, end_date],
    );
    const kejuaraanId = result.insertId;

    // Insert aturan kategori usia
    for (const rule of kategori_usia_rules) {
      await conn.query(
        `INSERT INTO kejuaraan_kategori_usia (kejuaraan_id, kategori_usia_id, tahun_lahir_min, tahun_lahir_max)
         VALUES (?, ?, ?, ?)`,
        [
          kejuaraanId,
          rule.kategori_usia_id,
          rule.tahun_lahir_min || null,
          rule.tahun_lahir_max || null,
        ],
      );
    }

    await conn.commit();

    return res.status(201).json({
      message: "Kejuaraan berhasil dibuat",
      data: {
        id: kejuaraanId,
        name: name.trim(),
        level,
        location: locationValue,
        year: finalYear,
        start_date,
        end_date,
        kategori_usia_rules,
      },
    });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    return res.status(500).json({
      message: "Gagal membuat kejuaraan",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
