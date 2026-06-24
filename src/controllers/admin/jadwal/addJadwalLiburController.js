const db = require("../../../config/database");

exports.addLiburJadwal = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const jadwalId = parseInt(req.params.id);
    const { tanggal, keterangan } = req.body;

    // Validasi ID Jadwal
    if (isNaN(jadwalId) || jadwalId < 1) {
      return res.status(400).json({
        message: "ID jadwal tidak valid",
      });
    }

    // Validasi tanggal
    if (!tanggal || isNaN(Date.parse(tanggal))) {
      return res.status(400).json({
        message: "Tanggal harus diisi dengan format YYYY-MM-DD",
      });
    }

    // Tidak boleh tanggal yang sudah lewat
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const inputDate = new Date(tanggal);
    inputDate.setHours(0, 0, 0, 0);

    if (inputDate < today) {
      return res.status(400).json({
        message: "Tanggal libur tidak boleh lebih kecil dari hari ini",
      });
    }

    // Cek jadwal ada
    const [jadwal] = await conn.query(
      `
      SELECT id
      FROM jadwal
      WHERE id = ?
      LIMIT 1
      `,
      [jadwalId],
    );

    if (jadwal.length === 0) {
      return res.status(404).json({
        message: "Jadwal tidak ditemukan",
      });
    }

    // Cegah duplikasi
    const [existing] = await conn.query(
      `
      SELECT id
      FROM libur_jadwal
      WHERE jadwal_id = ?
      AND tanggal = ?
      LIMIT 1
      `,
      [jadwalId, tanggal],
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: "Tanggal sudah terdaftar sebagai libur untuk jadwal ini",
      });
    }

    // Simpan data
    const [insertResult] = await conn.query(
      `
      INSERT INTO libur_jadwal (
        jadwal_id,
        tanggal,
        keterangan
      )
      VALUES (?, ?, ?)
      `,
      [jadwalId, tanggal, keterangan?.trim() || null],
    );

    // Ambil data yang baru dibuat
    const [newLibur] = await conn.query(
      `
      SELECT
        lj.id,
        lj.jadwal_id,
        lj.tanggal,
        lj.keterangan,
        lj.created_at,
        j.nama AS jadwal_nama,
        j.tipe AS jadwal_tipe
      FROM libur_jadwal lj
      INNER JOIN jadwal j
        ON j.id = lj.jadwal_id
      WHERE lj.id = ?
      LIMIT 1
      `,
      [insertResult.insertId],
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
