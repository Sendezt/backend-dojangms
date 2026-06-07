const db = require("../../../config/database");

exports.addLiburJadwal = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const jadwalId = parseInt(req.params.id);
    const { tanggal, keterangan } = req.body;

    if (isNaN(jadwalId) || jadwalId < 1) {
      return res.status(400).json({ message: "ID jadwal tidak valid" });
    }
    if (!tanggal || isNaN(Date.parse(tanggal))) {
      return res.status(400).json({ message: "Tanggal harus diisi dan format YYYY-MM-DD" });
    }

    // Cek apakah jadwal ada
    const [jadwal] = await conn.query("SELECT id FROM jadwal WHERE id = ?", [jadwalId]);
    if (jadwal.length === 0) {
      return res.status(404).json({ message: "Jadwal tidak ditemukan" });
    }

    // Cegah duplikasi libur untuk jadwal dan tanggal yang sama
    const [existing] = await conn.query(
      "SELECT id FROM libur_jadwal WHERE jadwal_id = ? AND tanggal = ?",
      [jadwalId, tanggal]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: "Tanggal sudah terdaftar sebagai libur untuk jadwal ini" });
    }

    await conn.query(
      "INSERT INTO libur_jadwal (jadwal_id, tanggal, keterangan) VALUES (?, ?, ?)",
      [jadwalId, tanggal, keterangan || null]
    );

    const [newLibur] = await conn.query(
      "SELECT id, jadwal_id, tanggal, keterangan, created_at FROM libur_jadwal WHERE jadwal_id = ? AND tanggal = ?",
      [jadwalId, tanggal]
    );

    return res.status(201).json({
      message: "Hari libur berhasil ditambahkan",
      data: newLibur[0],
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