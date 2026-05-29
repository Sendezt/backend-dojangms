const db = require("../../config/database");

// ─────────────────────────────────────────────
// JADWAL LATIHAN WAJIB
// ─────────────────────────────────────────────

/**
 * GET /api/admin/latihan-wajib
 * Ambil semua jadwal latihan wajib (opsional filter status)
 */
const getJadwalLatihanWajib = async (req, res) => {
  try {
    const { status } = req.query; // 'aktif' | 'nonaktif'
    let sql = "SELECT * FROM jadwal_latihan_wajib";
    const params = [];

    if (status) {
      sql += " WHERE status = ?";
      params.push(status);
    }

    sql +=
      ' ORDER BY FIELD(hari, "senin","selasa","rabu","kamis","jumat","sabtu","minggu"), jam_mulai';

    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({
        success: false,
        message: "Gagal mengambil data jadwal latihan wajib.",
      });
  }
};

/**
 * GET /api/admin/latihan-wajib/:id
 * Ambil detail satu jadwal latihan wajib
 */
const getJadwalLatihanWajibById = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM jadwal_latihan_wajib WHERE id = ?",
      [req.params.id],
    );
    if (!rows.length) {
      return res
        .status(404)
        .json({ success: false, message: "Jadwal tidak ditemukan." });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Gagal mengambil data." });
  }
};

/**
 * POST /api/admin/latihan-wajib
 * Tambah jadwal latihan wajib baru
 * Body: { hari, jam_mulai, jam_selesai, lokasi?, keterangan?, status? }
 */
const createJadwalLatihanWajib = async (req, res) => {
  try {
    const { hari, jam_mulai, jam_selesai, lokasi, keterangan, status } =
      req.body;

    if (!hari || !jam_mulai || !jam_selesai) {
      return res
        .status(400)
        .json({
          success: false,
          message: "hari, jam_mulai, dan jam_selesai wajib diisi.",
        });
    }

    const hariValid = [
      "senin",
      "selasa",
      "rabu",
      "kamis",
      "jumat",
      "sabtu",
      "minggu",
    ];
    if (!hariValid.includes(hari)) {
      return res
        .status(400)
        .json({
          success: false,
          message: `hari harus salah satu dari: ${hariValid.join(", ")}.`,
        });
    }

    if (jam_mulai >= jam_selesai) {
      return res
        .status(400)
        .json({
          success: false,
          message: "jam_selesai harus lebih besar dari jam_mulai.",
        });
    }

    const [result] = await db.query(
      "INSERT INTO jadwal_latihan_wajib (hari, jam_mulai, jam_selesai, lokasi, keterangan, status) VALUES (?, ?, ?, ?, ?, ?)",
      [
        hari,
        jam_mulai,
        jam_selesai,
        lokasi || null,
        keterangan || null,
        status || "aktif",
      ],
    );

    const [newRow] = await db.query(
      "SELECT * FROM jadwal_latihan_wajib WHERE id = ?",
      [result.insertId],
    );
    res
      .status(201)
      .json({
        success: true,
        message: "Jadwal latihan wajib berhasil ditambahkan.",
        data: newRow[0],
      });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({
        success: false,
        message: "Gagal menambahkan jadwal latihan wajib.",
      });
  }
};

/**
 * PUT /api/admin/latihan-wajib/:id
 * Update jadwal latihan wajib
 */
const updateJadwalLatihanWajib = async (req, res) => {
  try {
    const { id } = req.params;
    const { hari, jam_mulai, jam_selesai, lokasi, keterangan, status } =
      req.body;

    const [existing] = await db.query(
      "SELECT id FROM jadwal_latihan_wajib WHERE id = ?",
      [id],
    );
    if (!existing.length) {
      return res
        .status(404)
        .json({ success: false, message: "Jadwal tidak ditemukan." });
    }

    const hariValid = [
      "senin",
      "selasa",
      "rabu",
      "kamis",
      "jumat",
      "sabtu",
      "minggu",
    ];
    if (hari && !hariValid.includes(hari)) {
      return res
        .status(400)
        .json({
          success: false,
          message: `hari harus salah satu dari: ${hariValid.join(", ")}.`,
        });
    }

    if (jam_mulai && jam_selesai && jam_mulai >= jam_selesai) {
      return res
        .status(400)
        .json({
          success: false,
          message: "jam_selesai harus lebih besar dari jam_mulai.",
        });
    }

    await db.query(
      `UPDATE jadwal_latihan_wajib SET
        hari = COALESCE(?, hari),
        jam_mulai = COALESCE(?, jam_mulai),
        jam_selesai = COALESCE(?, jam_selesai),
        lokasi = COALESCE(?, lokasi),
        keterangan = COALESCE(?, keterangan),
        status = COALESCE(?, status)
      WHERE id = ?`,
      [
        hari || null,
        jam_mulai || null,
        jam_selesai || null,
        lokasi || null,
        keterangan || null,
        status || null,
        id,
      ],
    );

    const [updated] = await db.query(
      "SELECT * FROM jadwal_latihan_wajib WHERE id = ?",
      [id],
    );
    res.json({
      success: true,
      message: "Jadwal latihan wajib berhasil diperbarui.",
      data: updated[0],
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({
        success: false,
        message: "Gagal memperbarui jadwal latihan wajib.",
      });
  }
};

/**
 * DELETE /api/admin/latihan-wajib/:id
 * Hapus jadwal latihan wajib
 */
const deleteJadwalLatihanWajib = async (req, res) => {
  try {
    const [existing] = await db.query(
      "SELECT id FROM jadwal_latihan_wajib WHERE id = ?",
      [req.params.id],
    );
    if (!existing.length) {
      return res
        .status(404)
        .json({ success: false, message: "Jadwal tidak ditemukan." });
    }

    await db.query("DELETE FROM jadwal_latihan_wajib WHERE id = ?", [
      req.params.id,
    ]);
    res.json({
      success: true,
      message: "Jadwal latihan wajib berhasil dihapus.",
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({
        success: false,
        message: "Gagal menghapus jadwal latihan wajib.",
      });
  }
};

// ─────────────────────────────────────────────
// LIBUR LATIHAN WAJIB
// ─────────────────────────────────────────────

/**
 * GET /api/admin/latihan-wajib/libur
 * Ambil semua tanggal libur (opsional filter bulan/tahun)
 */
const getLibur = async (req, res) => {
  try {
    const { bulan, tahun } = req.query;
    let sql = "SELECT * FROM libur_latihan_wajib";
    const params = [];

    if (bulan && tahun) {
      sql += " WHERE MONTH(tanggal) = ? AND YEAR(tanggal) = ?";
      params.push(bulan, tahun);
    } else if (tahun) {
      sql += " WHERE YEAR(tanggal) = ?";
      params.push(tahun);
    }

    sql += " ORDER BY tanggal ASC";

    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Gagal mengambil data libur." });
  }
};

/**
 * POST /api/admin/latihan-wajib/libur
 * Tambah tanggal libur baru
 * Body: { tanggal, keterangan? }
 */
const createLibur = async (req, res) => {
  try {
    const { tanggal, keterangan } = req.body;

    if (!tanggal) {
      return res
        .status(400)
        .json({
          success: false,
          message: "tanggal wajib diisi (format: YYYY-MM-DD).",
        });
    }

    // Cek duplikat
    const [existing] = await db.query(
      "SELECT id FROM libur_latihan_wajib WHERE tanggal = ?",
      [tanggal],
    );
    if (existing.length) {
      return res
        .status(409)
        .json({
          success: false,
          message: `Tanggal ${tanggal} sudah terdaftar sebagai hari libur.`,
        });
    }

    const [result] = await db.query(
      "INSERT INTO libur_latihan_wajib (tanggal, keterangan) VALUES (?, ?)",
      [tanggal, keterangan || null],
    );

    const [newRow] = await db.query(
      "SELECT * FROM libur_latihan_wajib WHERE id = ?",
      [result.insertId],
    );
    res
      .status(201)
      .json({
        success: true,
        message: "Hari libur berhasil ditambahkan.",
        data: newRow[0],
      });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Gagal menambahkan hari libur." });
  }
};

/**
 * PUT /api/admin/latihan-wajib/libur/:id
 * Update keterangan hari libur (tanggal tidak boleh diubah untuk menjaga integritas)
 */
const updateLibur = async (req, res) => {
  try {
    const { id } = req.params;
    const { tanggal, keterangan } = req.body;

    const [existing] = await db.query(
      "SELECT * FROM libur_latihan_wajib WHERE id = ?",
      [id],
    );
    if (!existing.length) {
      return res
        .status(404)
        .json({ success: false, message: "Data libur tidak ditemukan." });
    }

    // Cek konflik jika tanggal diubah
    if (tanggal && tanggal !== existing[0].tanggal) {
      const [conflict] = await db.query(
        "SELECT id FROM libur_latihan_wajib WHERE tanggal = ? AND id != ?",
        [tanggal, id],
      );
      if (conflict.length) {
        return res
          .status(409)
          .json({
            success: false,
            message: `Tanggal ${tanggal} sudah terdaftar.`,
          });
      }
    }

    await db.query(
      "UPDATE libur_latihan_wajib SET tanggal = COALESCE(?, tanggal), keterangan = COALESCE(?, keterangan) WHERE id = ?",
      [tanggal || null, keterangan !== undefined ? keterangan : null, id],
    );

    const [updated] = await db.query(
      "SELECT * FROM libur_latihan_wajib WHERE id = ?",
      [id],
    );
    res.json({
      success: true,
      message: "Data libur berhasil diperbarui.",
      data: updated[0],
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Gagal memperbarui data libur." });
  }
};

/**
 * DELETE /api/admin/latihan-wajib/libur/:id
 * Hapus hari libur
 */
const deleteLibur = async (req, res) => {
  try {
    const [existing] = await db.query(
      "SELECT id FROM libur_latihan_wajib WHERE id = ?",
      [req.params.id],
    );
    if (!existing.length) {
      return res
        .status(404)
        .json({ success: false, message: "Data libur tidak ditemukan." });
    }

    await db.query("DELETE FROM libur_latihan_wajib WHERE id = ?", [
      req.params.id,
    ]);
    res.json({ success: true, message: "Hari libur berhasil dihapus." });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Gagal menghapus hari libur." });
  }
};

module.exports = {
  getJadwalLatihanWajib,
  getJadwalLatihanWajibById,
  createJadwalLatihanWajib,
  updateJadwalLatihanWajib,
  deleteJadwalLatihanWajib,
  getLibur,
  createLibur,
  updateLibur,
  deleteLibur,
};
