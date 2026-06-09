const db = require("../../../config/database");

exports.createKejuaraan = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const { name, level, location, start_date, end_date } = req.body;

    // Validasi input
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

    // ========== VALIDASI DUPLIKAT (berdasarkan tanggal + lokasi) ==========
    // Cek apakah sudah ada kejuaraan dengan start_date, end_date, dan lokasi yang sama
    let query = `
      SELECT id FROM kejuaraan
      WHERE start_date = ? AND end_date = ?
    `;
    const params = [start_date, end_date];

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

    // Cek overlap di lokasi yang sama
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

    // Insert kejuaraan
    const [result] = await conn.query(
      `INSERT INTO kejuaraan (name, level, location, year, start_date, end_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name.trim(), level, locationValue, finalYear, start_date, end_date],
    );

    return res.status(201).json({
      message: "Kejuaraan berhasil dibuat",
      data: {
        id: result.insertId,
        name: name.trim(),
        level,
        location: locationValue,
        year: finalYear,
        start_date,
        end_date,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal membuat kejuaraan",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
