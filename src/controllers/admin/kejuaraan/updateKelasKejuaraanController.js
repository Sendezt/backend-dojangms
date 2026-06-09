const db = require("../../../config/database");

exports.updateKejuaraan = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const kejuaraanId = parseInt(req.params.id);
    const { name, level, location, start_date, end_date } = req.body;

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

    // Validasi input jika ada perubahan
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

    // Konversi ke Date object untuk perbandingan
    const start = new Date(newStartDate);
    const end = new Date(newEndDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Validasi: tanggal mulai tidak boleh kurang dari hari ini
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
      WHERE id != ?
        AND start_date <= ? AND end_date >= ?
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

    // Lakukan update
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

    return res.status(200).json({
      message: "Kejuaraan berhasil diperbarui",
      data: {
        id: kejuaraanId,
        name: newName.trim(),
        level: newLevel,
        location: locationValue,
        year: finalYear,
        start_date: newStartDate,
        end_date: newEndDate,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal memperbarui kejuaraan",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
