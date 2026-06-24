const db = require("../../../config/database");

exports.bulkAddLiburJadwal = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const jadwalId = parseInt(req.params.id);
    const { tanggal_list, keterangan } = req.body; // tanggal_list: array of strings "YYYY-MM-DD"

    if (isNaN(jadwalId) || jadwalId < 1) {
      return res.status(400).json({ message: "ID jadwal tidak valid" });
    }
    if (
      !tanggal_list ||
      !Array.isArray(tanggal_list) ||
      tanggal_list.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "tanggal_list harus berupa array non-kosong" });
    }

    // Validasi setiap tanggal
    const validDates = [];
    const invalidDates = [];
    for (const tgl of tanggal_list) {
      if (tgl && !isNaN(Date.parse(tgl))) {
        validDates.push(tgl);
      } else {
        invalidDates.push(tgl);
      }
    }
    if (validDates.length === 0) {
      return res
        .status(400)
        .json({ message: "Tidak ada tanggal valid dalam array" });
    }

    // Cek apakah jadwal ada
    const [jadwal] = await conn.query("SELECT id FROM jadwal WHERE id = ?", [
      jadwalId,
    ]);
    if (jadwal.length === 0) {
      return res.status(404).json({ message: "Jadwal tidak ditemukan" });
    }

    // Cek duplikasi di database: ambil tanggal yang sudah ada
    const placeholders = validDates.map(() => "?").join(",");
    const [existing] = await conn.query(
      `SELECT tanggal FROM libur_jadwal WHERE jadwal_id = ? AND tanggal IN (${placeholders})`,
      [jadwalId, ...validDates],
    );
    const existingDates = existing.map((row) => row.tanggal);
    const newDates = validDates.filter((tgl) => !existingDates.includes(tgl));

    if (newDates.length === 0) {
      return res
        .status(409)
        .json({
          message:
            "Semua tanggal sudah terdaftar sebagai libur untuk jadwal ini",
        });
    }

    // Insert bulk
    const values = newDates.map((tgl) => [jadwalId, tgl, keterangan || null]);
    await conn.query(
      "INSERT INTO libur_jadwal (jadwal_id, tanggal, keterangan) VALUES ?",
      [values],
    );

    // Ambil data yang baru ditambahkan
    const [inserted] = await conn.query(
      `SELECT id, jadwal_id, tanggal, keterangan, created_at FROM libur_jadwal 
       WHERE jadwal_id = ? AND tanggal IN (${newDates.map(() => "?").join(",")})`,
      [jadwalId, ...newDates],
    );

    return res.status(201).json({
      message: `Berhasil menambahkan ${inserted.length} hari libur`,
      summary: {
        total_requested: tanggal_list.length,
        total_success: inserted.length,
        total_failed: invalidDates.length + existingDates.length,
      },
      details: {
        success: inserted,
        failed: {
          invalid_format: invalidDates,
          already_exist: existingDates,
        },
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal menambahkan hari libur",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
