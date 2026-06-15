const db = require("../../../config/database");

exports.updateKejuaraan = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const kejuaraanId = parseInt(req.params.id);
    const { name, level, location, start_date, end_date, kategori_usia_rules } =
      req.body;

    if (!kejuaraanId || isNaN(kejuaraanId) || kejuaraanId < 1) {
      return res.status(400).json({ message: "ID kejuaraan tidak valid" });
    }

    // Ambil data kejuaraan yang ada
    const [[existing]] = await conn.query(
      "SELECT id, name, level, location, start_date, end_date FROM kejuaraan WHERE id = ?",
      [kejuaraanId],
    );
    if (!existing) {
      return res.status(404).json({ message: "Kejuaraan tidak ditemukan" });
    }

    // Gunakan nilai baru jika dikirim, jika tidak pakai nilai lama
    const newName = name !== undefined ? name : existing.name;
    const newLevel = level !== undefined ? level : existing.level;
    const newLocation = location !== undefined ? location : existing.location;
    let newStartDate =
      start_date !== undefined ? start_date : existing.start_date;
    let newEndDate = end_date !== undefined ? end_date : existing.end_date;

    // Validasi input dasar
    if (
      name !== undefined &&
      (!newName || typeof newName !== "string" || newName.trim() === "")
    ) {
      return res
        .status(400)
        .json({ message: "Nama kejuaraan tidak boleh kosong" });
    }
    if (
      level !== undefined &&
      !["kota", "provinsi", "nasional", "internasional"].includes(newLevel)
    ) {
      return res.status(400).json({ message: "Level kejuaraan tidak valid" });
    }
    if (start_date !== undefined && isNaN(new Date(newStartDate).getTime())) {
      return res.status(400).json({ message: "Tanggal mulai tidak valid" });
    }
    if (end_date !== undefined && isNaN(new Date(newEndDate).getTime())) {
      return res.status(400).json({ message: "Tanggal selesai tidak valid" });
    }

    const start = new Date(newStartDate);
    const end = new Date(newEndDate);
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
      newLocation && typeof newLocation === "string"
        ? newLocation.trim()
        : null;

    // Validasi overlap dengan kejuaraan lain (kecuali dirinya sendiri)
    let overlapQuery = `
      SELECT id, name, start_date, end_date FROM kejuaraan
      WHERE id != ? AND start_date <= ? AND end_date >= ?
    `;
    let overlapParams = [kejuaraanId, newEndDate, newStartDate];
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
        message: `Tidak dapat update kejuaraan karena bentrok dengan kejuaraan "${c.name}" pada tanggal ${c.start_date} s.d ${c.end_date} di lokasi yang sama.`,
      });
    }

    // Mulai transaction
    await conn.beginTransaction();

    // Update kejuaraan
    await conn.query(
      `UPDATE kejuaraan
       SET name = ?, level = ?, location = ?, year = ?, start_date = ?, end_date = ?
       WHERE id = ?`,
      [
        newName.trim(),
        newLevel,
        locationValue,
        finalYear,
        newStartDate,
        newEndDate,
        kejuaraanId,
      ],
    );

    // Jika kategori_usia_rules dikirim, update aturan (replace all)
    if (kategori_usia_rules !== undefined) {
      if (
        !Array.isArray(kategori_usia_rules) ||
        kategori_usia_rules.length === 0
      ) {
        await conn.rollback();
        return res.status(400).json({
          message: "kategori_usia_rules harus berupa array tidak kosong",
        });
      }

      // Validasi aturan (sama seperti di create)
      const [allKategori] = await conn.query("SELECT id FROM kategori_usia");
      const validKategoriIds = allKategori.map((k) => k.id);
      const usedKategoriIds = new Set();

      for (const rule of kategori_usia_rules) {
        const { kategori_usia_id, tahun_lahir_min, tahun_lahir_max } = rule;
        if (!validKategoriIds.includes(kategori_usia_id)) {
          await conn.rollback();
          return res.status(400).json({
            message: `Kategori usia ID ${kategori_usia_id} tidak valid`,
          });
        }
        if (usedKategoriIds.has(kategori_usia_id)) {
          await conn.rollback();
          return res.status(400).json({
            message: `Kategori usia ID ${kategori_usia_id} hanya boleh didefinisikan sekali`,
          });
        }
        usedKategoriIds.add(kategori_usia_id);

        const hasMin =
          tahun_lahir_min !== undefined &&
          tahun_lahir_min !== null &&
          tahun_lahir_min !== "";
        const hasMax =
          tahun_lahir_max !== undefined &&
          tahun_lahir_max !== null &&
          tahun_lahir_max !== "";
        if (!hasMin && !hasMax) {
          await conn.rollback();
          return res.status(400).json({
            message: `Untuk kategori usia ${kategori_usia_id}, harus mengisi minimal tahun_lahir_min atau tahun_lahir_max`,
          });
        }

        let minYear = null;
        if (hasMin) {
          minYear = parseInt(tahun_lahir_min);
          if (isNaN(minYear)) {
            await conn.rollback();
            return res.status(400).json({
              message: `Tahun lahir minimal untuk kategori usia ${kategori_usia_id} harus berupa angka`,
            });
          }
          if (minYear < 1900 || minYear > new Date().getFullYear() + 5) {
            await conn.rollback();
            return res.status(400).json({
              message: `Tahun lahir minimal tidak valid untuk kategori usia ${kategori_usia_id}`,
            });
          }
        }

        let maxYear = null;
        if (hasMax) {
          maxYear = parseInt(tahun_lahir_max);
          if (isNaN(maxYear)) {
            await conn.rollback();
            return res.status(400).json({
              message: `Tahun lahir maksimal untuk kategori usia ${kategori_usia_id} harus berupa angka`,
            });
          }
          if (maxYear < 1900 || maxYear > new Date().getFullYear() + 5) {
            await conn.rollback();
            return res.status(400).json({
              message: `Tahun lahir maksimal tidak valid untuk kategori usia ${kategori_usia_id}`,
            });
          }
        }

        if (hasMin && hasMax && minYear > maxYear) {
          await conn.rollback();
          return res.status(400).json({
            message: `Tahun lahir minimal harus <= tahun lahir maksimal untuk kategori usia ${kategori_usia_id}`,
          });
        }
      }

      // Hapus aturan lama, insert baru
      await conn.query(
        "DELETE FROM kejuaraan_kategori_usia WHERE kejuaraan_id = ?",
        [kejuaraanId],
      );
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
    }

    await conn.commit();

    // Ambil data terbaru untuk response
    const [updated] = await conn.query(
      "SELECT id, name, level, location, year, start_date, end_date FROM kejuaraan WHERE id = ?",
      [kejuaraanId],
    );

    // Sertakan aturan usia terbaru dalam response (apakah diupdate atau tidak)
    let rules;
    if (kategori_usia_rules !== undefined) {
      rules = kategori_usia_rules;
    } else {
      const [ruleRows] = await conn.query(
        "SELECT kategori_usia_id, tahun_lahir_min, tahun_lahir_max FROM kejuaraan_kategori_usia WHERE kejuaraan_id = ?",
        [kejuaraanId],
      );
      rules = ruleRows;
    }

    return res.status(200).json({
      message: "Kejuaraan berhasil diperbarui",
      data: {
        ...updated[0],
        kategori_usia_rules: rules,
      },
    });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    return res.status(500).json({
      message: "Gagal memperbarui kejuaraan",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
