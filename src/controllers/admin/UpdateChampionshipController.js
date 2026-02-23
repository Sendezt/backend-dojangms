const db = require("../../config/database");

exports.updateChampionship = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, level, location, start_date, end_date } = req.body;

    // =====================
    // VALIDASI ID
    // =====================
    if (!id) {
      return res.status(400).json({
        message: "ID championship wajib diisi",
      });
    }

    // =====================
    // MINIMAL 1 FIELD
    // =====================
    if (
      name === undefined &&
      level === undefined &&
      location === undefined &&
      start_date === undefined &&
      end_date === undefined
    ) {
      return res.status(400).json({
        message: "Minimal satu field harus diupdate",
      });
    }

    // =====================
    // CEK DATA EXISTING
    // =====================
    const [rows] = await db.execute("SELECT * FROM kejuaraan WHERE id = ?", [
      id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Championship tidak ditemukan",
      });
    }

    const current = rows[0];

    // =====================
    // VALIDASI LEVEL (JIKA ADA)
    // =====================
    if (level !== undefined) {
      const allowedLevels = ["kota", "provinsi", "nasional", "internasional"];

      if (!allowedLevels.includes(level)) {
        return res.status(400).json({
          message: "level tidak valid",
        });
      }
    }

    // =====================
    // VALIDASI TANGGAL
    // =====================
    const newStartDate = start_date ?? current.start_date;
    const newEndDate = end_date ?? current.end_date;

    if (new Date(newStartDate) > new Date(newEndDate)) {
      return res.status(400).json({
        message: "start_date tidak boleh lebih besar dari end_date",
      });
    }

    // =====================
    // GABUNG DATA BARU + LAMA
    // =====================
    const updatedData = {
      name: name ?? current.name,
      level: level ?? current.level,
      location: location ?? current.location,
      start_date: newStartDate,
      end_date: newEndDate,
    };

    // =====================
    // UPDATE DATABASE
    // =====================
    const query = `
      UPDATE kejuaraan
      SET name = ?, level = ?, location = ?, start_date = ?, end_date = ?
      WHERE id = ?
    `;

    await db.execute(query, [
      updatedData.name,
      updatedData.level,
      updatedData.location,
      updatedData.start_date,
      updatedData.end_date,
      id,
    ]);

    // =====================
    // RESPONSE
    // =====================
    res.status(200).json({
      message: "Championship berhasil diperbarui",
      data: {
        id,
        ...updatedData,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Terjadi kesalahan pada server",
    });
  }
};
