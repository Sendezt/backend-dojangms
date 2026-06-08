const db = require("../../../config/database");

exports.bulkCreateLiburGlobal = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { items } = req.body; // items = [{ tanggal, keterangan }]

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ message: "items harus berupa array non-kosong" });
    }

    // Validasi tiap item
    const validItems = [];
    const invalidItems = [];
    for (let item of items) {
      if (item.tanggal && !isNaN(Date.parse(item.tanggal))) {
        validItems.push({
          tanggal: item.tanggal,
          keterangan: item.keterangan || null,
        });
      } else {
        invalidItems.push(item);
      }
    }
    if (validItems.length === 0) {
      return res
        .status(400)
        .json({ message: "Tidak ada tanggal valid dalam array" });
    }

    // Cek duplikasi dengan database
    const tanggalList = validItems.map((i) => i.tanggal);
    const placeholders = tanggalList.map(() => "?").join(",");
    const [existing] = await conn.query(
      `SELECT tanggal FROM libur_global WHERE tanggal IN (${placeholders})`,
      tanggalList,
    );
    const existingTanggal = existing.map((row) => row.tanggal);
    const newItems = validItems.filter(
      (i) => !existingTanggal.includes(i.tanggal),
    );

    if (newItems.length === 0) {
      return res.status(409).json({
        message: "Semua tanggal sudah terdaftar sebagai libur global",
      });
    }

    // Insert bulk
    const values = newItems.map((i) => [i.tanggal, i.keterangan]);
    await conn.query(
      "INSERT INTO libur_global (tanggal, keterangan) VALUES ?",
      [values],
    );

    // Ambil data yang baru masuk
    const newTanggalList = newItems.map((i) => i.tanggal);
    const newPlaceholders = newTanggalList.map(() => "?").join(",");
    const [inserted] = await conn.query(
      `SELECT id, tanggal, keterangan, created_at FROM libur_global WHERE tanggal IN (${newPlaceholders})`,
      newTanggalList,
    );

    return res.status(201).json({
      message: `Berhasil menambahkan ${inserted.length} libur global`,
      summary: {
        total_requested: items.length,
        total_success: inserted.length,
        total_failed: invalidItems.length + existingTanggal.length,
      },
      details: {
        success: inserted,
        failed: {
          invalid_format: invalidItems,
          already_exist: existingTanggal,
        },
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal menambahkan libur global",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
