// src/controllers/admin/ujianSabuk/createUjianSabukController.js
const db = require("../../../config/database");

// Helper untuk cek overlap ujian di lokasi yang sama (hanya yang statusnya bukan dibatalkan)
async function checkUjianConflict(
  conn,
  tanggal_mulai,
  tanggal_selesai,
  lokasi,
  excludeId = null,
) {
  let sql = `
    SELECT id FROM ujian_sabuk
    WHERE lokasi = ?
      AND status != 'dibatalkan'
      AND (
        (tanggal_mulai <= ? AND tanggal_selesai >= ?) OR
        (tanggal_mulai <= ? AND tanggal_selesai >= ?) OR
        (tanggal_mulai >= ? AND tanggal_mulai <= ?)
      )
  `;
  let params = [
    lokasi,
    tanggal_selesai,
    tanggal_mulai,
    tanggal_selesai,
    tanggal_mulai,
    tanggal_mulai,
    tanggal_selesai,
  ];
  if (excludeId) {
    sql += ` AND id != ?`;
    params.push(excludeId);
  }
  const [rows] = await conn.query(sql, params);
  return rows.length > 0;
}

exports.createUjianSabuk = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const {
      level_ujian,
      tanggal,
      tanggal_mulai,
      tanggal_selesai,
      lokasi,
      keterangan,
      status,
    } = req.body;

    // 1. Validasi level_ujian
    const allowedLevels = ["kota", "provinsi"];
    const finalLevel =
      level_ujian && allowedLevels.includes(level_ujian) ? level_ujian : "kota";

    let finalTanggalMulai, finalTanggalSelesai;

    // 2. Proses tanggal berdasarkan level
    if (finalLevel === "kota") {
      if (!tanggal || isNaN(Date.parse(tanggal))) {
        return res
          .status(400)
          .json({
            message:
              "Tanggal ujian wajib diisi dengan format valid (YYYY-MM-DD)",
          });
      }
      finalTanggalMulai = tanggal;
      finalTanggalSelesai = tanggal;
    } else {
      if (
        !tanggal_mulai ||
        !tanggal_selesai ||
        isNaN(Date.parse(tanggal_mulai)) ||
        isNaN(Date.parse(tanggal_selesai))
      ) {
        return res
          .status(400)
          .json({
            message:
              "Tanggal mulai dan selesai wajib diisi dengan format valid (YYYY-MM-DD)",
          });
      }
      const start = new Date(tanggal_mulai);
      const end = new Date(tanggal_selesai);
      if (end < start) {
        return res
          .status(400)
          .json({
            message:
              "Tanggal selesai harus setelah atau sama dengan tanggal mulai",
          });
      }
      finalTanggalMulai = tanggal_mulai;
      finalTanggalSelesai = tanggal_selesai;
    }

    // 3. Validasi tanggal tidak boleh kurang dari hari ini
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(finalTanggalMulai) < today) {
      return res
        .status(400)
        .json({ message: "Tanggal ujian tidak boleh kurang dari hari ini" });
    }

    // 4. Validasi status (opsional)
    if (status && !["terjadwal", "selesai", "dibatalkan"].includes(status)) {
      return res.status(400).json({ message: "Status tidak valid" });
    }

    // 5. Lokasi wajib diisi
    if (!lokasi || typeof lokasi !== "string" || lokasi.trim() === "") {
      return res.status(400).json({ message: "Lokasi wajib diisi" });
    }

    // 6. Cek conflict dengan ujian lain di lokasi yang sama
    const isConflict = await checkUjianConflict(
      conn,
      finalTanggalMulai,
      finalTanggalSelesai,
      lokasi,
    );
    if (isConflict) {
      return res
        .status(409)
        .json({
          message:
            "Sudah ada ujian lain di lokasi yang sama pada rentang tanggal yang tumpang tindih",
        });
    }

    // 7. Insert ke database
    const [result] = await conn.query(
      `INSERT INTO ujian_sabuk (tanggal_mulai, tanggal_selesai, level_ujian, lokasi, keterangan, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        finalTanggalMulai,
        finalTanggalSelesai,
        finalLevel,
        lokasi.trim(),
        keterangan || null,
        status || "terjadwal",
      ],
    );

    const [newUjian] = await conn.query(
      "SELECT * FROM ujian_sabuk WHERE id = ?",
      [result.insertId],
    );

    res.status(201).json({
      message: "Ujian sabuk berhasil dibuat",
      data: newUjian[0],
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Gagal membuat ujian sabuk", error: error.message });
  } finally {
    conn.release();
  }
};
