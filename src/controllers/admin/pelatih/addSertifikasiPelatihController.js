const db = require("../../../config/database");

/**
 * POST /api/admin/pelatih/:pelatihId/sertifikasi
 * Body: { "nama_sertifikasi": "Sertifikasi Pelatih Nasional" }
 */
exports.addSertifikasiPelatih = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const pelatihId = parseInt(req.params.pelatihId);
    const { nama_sertifikasi } = req.body;

    // validasi input
    if (!pelatihId || isNaN(pelatihId) || pelatihId < 1) {
      return res.status(400).json({ message: "ID pelatih tidak valid" });
    }
    if (
      !nama_sertifikasi ||
      typeof nama_sertifikasi !== "string" ||
      nama_sertifikasi.trim() === ""
    ) {
      return res
        .status(400)
        .json({ message: "Nama sertifikasi wajib diisi dan berupa string" });
    }

    // cek apakah user_id adalah pelatih dan ambil pelatih.id
    const [pelatihRecord] = await conn.query(
      `SELECT p.id
       FROM pelatih p
       JOIN users u ON u.id = p.user_id
       JOIN user_roles ur ON ur.user_id = u.id
       JOIN roles r ON r.id = ur.role_id
       WHERE u.id = ? AND r.name = 'pelatih'`,
      [pelatihId],
    );

    if (pelatihRecord.length === 0) {
      return res.status(404).json({ message: "Pelatih tidak ditemukan" });
    }

    const pelatihTableId = pelatihRecord[0].id;

    // insert sertifikasi baru
    const [result] = await conn.query(
      `INSERT INTO sertifikasi_pelatih (pelatih_id, nama_sertifikasi)
       VALUES (?, ?)`,
      [pelatihTableId, nama_sertifikasi.trim()],
    );

    return res.status(201).json({
      message: "Sertifikasi berhasil ditambahkan",
      data: {
        id: result.insertId,
        pelatih_id: pelatihTableId,
        nama_sertifikasi: nama_sertifikasi.trim(),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal menambahkan sertifikasi",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
