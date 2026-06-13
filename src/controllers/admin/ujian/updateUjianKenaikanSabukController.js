// src/controllers/admin/ujianSabuk/updateUjianSabukController.js
const db = require("../../../config/database");

// Helper: cek overlap ujian di lokasi yang sama (kecuali ujian dengan id tertentu)
async function checkUjianConflict(
  conn,
  id,
  tanggal_mulai,
  tanggal_selesai,
  lokasi,
) {
  const sql = `
    SELECT id FROM ujian_sabuk
    WHERE lokasi = ?
      AND id != ?
      AND status != 'dibatalkan'
      AND (
        (tanggal_mulai <= ? AND tanggal_selesai >= ?) OR
        (tanggal_mulai <= ? AND tanggal_selesai >= ?) OR
        (tanggal_mulai >= ? AND tanggal_mulai <= ?)
      )
  `;
  const params = [
    lokasi,
    id,
    tanggal_selesai,
    tanggal_mulai,
    tanggal_selesai,
    tanggal_mulai,
    tanggal_mulai,
    tanggal_selesai,
  ];
  const [rows] = await conn.query(sql, params);
  return rows.length > 0;
}

exports.updateUjianSabuk = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id < 1) {
      return res.status(400).json({ message: "ID ujian tidak valid" });
    }

    // Cek apakah ujian ada
    const [existing] = await conn.query(
      "SELECT * FROM ujian_sabuk WHERE id = ?",
      [id],
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: "Ujian sabuk tidak ditemukan" });
    }
    const current = existing[0];

    // Ambil field dari body
    let {
      level_ujian,
      tanggal,
      tanggal_mulai,
      tanggal_selesai,
      lokasi,
      keterangan,
      status,
    } = req.body;

    // Gunakan nilai lama jika tidak dikirim
    let finalLevel =
      level_ujian !== undefined ? level_ujian : current.level_ujian;
    let finalLokasi = lokasi !== undefined ? lokasi : current.lokasi;
    let finalKeterangan =
      keterangan !== undefined ? keterangan : current.keterangan;
    let finalStatus = status !== undefined ? status : current.status;

    let finalTanggalMulai = current.tanggal_mulai;
    let finalTanggalSelesai = current.tanggal_selesai;

    // Validasi level_ujian
    const allowedLevels = ["kota", "provinsi"];
    if (level_ujian !== undefined && !allowedLevels.includes(finalLevel)) {
      return res
        .status(400)
        .json({ message: "Level ujian harus 'kota' atau 'provinsi'" });
    }

    // Validasi input tanggal sesuai level
    if (finalLevel === "kota") {
      // Kota: cukup gunakan field 'tanggal' (opsional bisa pakai tanggal_mulai/tanggal_selesai juga)
      if (tanggal !== undefined) {
        if (isNaN(Date.parse(tanggal))) {
          return res
            .status(400)
            .json({ message: "Format tanggal tidak valid" });
        }
        finalTanggalMulai = tanggal;
        finalTanggalSelesai = tanggal;
      } else if (tanggal_mulai !== undefined || tanggal_selesai !== undefined) {
        // Jika dikirim mulai/selesai, pastikan sama
        let newMulai =
          tanggal_mulai !== undefined ? tanggal_mulai : current.tanggal_mulai;
        let newSelesai =
          tanggal_selesai !== undefined
            ? tanggal_selesai
            : current.tanggal_selesai;
        if (newMulai !== newSelesai) {
          return res
            .status(400)
            .json({
              message:
                "Ujian tingkat kota hanya dapat dilaksanakan dalam 1 hari",
            });
        }
        if (isNaN(Date.parse(newMulai))) {
          return res
            .status(400)
            .json({ message: "Format tanggal tidak valid" });
        }
        finalTanggalMulai = newMulai;
        finalTanggalSelesai = newSelesai;
      }
    } else {
      // provinsi
      if (tanggal_mulai !== undefined || tanggal_selesai !== undefined) {
        let newMulai =
          tanggal_mulai !== undefined ? tanggal_mulai : current.tanggal_mulai;
        let newSelesai =
          tanggal_selesai !== undefined
            ? tanggal_selesai
            : current.tanggal_selesai;
        if (isNaN(Date.parse(newMulai)) || isNaN(Date.parse(newSelesai))) {
          return res
            .status(400)
            .json({ message: "Format tanggal mulai/selesai tidak valid" });
        }
        if (new Date(newSelesai) < new Date(newMulai)) {
          return res
            .status(400)
            .json({
              message:
                "Tanggal selesai harus setelah atau sama dengan tanggal mulai",
            });
        }
        finalTanggalMulai = newMulai;
        finalTanggalSelesai = newSelesai;
      } else if (tanggal !== undefined) {
        return res
          .status(400)
          .json({
            message:
              "Ujian tingkat provinsi harus menggunakan tanggal_mulai dan tanggal_selesai, bukan 'tanggal'",
          });
      }
    }

    // Validasi tanggal tidak boleh kurang dari hari ini (opsional, bisa diabaikan jika status sudah selesai)
    // Untuk memudahkan, kita validasi hanya jika status masih terjadwal atau akan diubah menjadi terjadwal
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(finalTanggalMulai) < today && finalStatus !== "selesai") {
      return res
        .status(400)
        .json({
          message:
            "Tanggal ujian tidak boleh kurang dari hari ini jika status belum selesai",
        });
    }

    // Validasi status
    if (
      status !== undefined &&
      !["terjadwal", "selesai", "dibatalkan"].includes(finalStatus)
    ) {
      return res.status(400).json({ message: "Status tidak valid" });
    }

    // Lokasi wajib diisi
    if (
      !finalLokasi ||
      typeof finalLokasi !== "string" ||
      finalLokasi.trim() === ""
    ) {
      return res.status(400).json({ message: "Lokasi wajib diisi" });
    }
    finalLokasi = finalLokasi.trim();

    // Cek conflict dengan ujian lain (kecuali diri sendiri)
    const isConflict = await checkUjianConflict(
      conn,
      id,
      finalTanggalMulai,
      finalTanggalSelesai,
      finalLokasi,
    );
    if (isConflict) {
      return res
        .status(409)
        .json({
          message: "Ujian bentrok dengan ujian lain di lokasi yang sama",
        });
    }

    // Lakukan update
    await conn.query(
      `UPDATE ujian_sabuk
       SET level_ujian = ?, tanggal_mulai = ?, tanggal_selesai = ?, lokasi = ?, keterangan = ?, status = ?
       WHERE id = ?`,
      [
        finalLevel,
        finalTanggalMulai,
        finalTanggalSelesai,
        finalLokasi,
        finalKeterangan || null,
        finalStatus,
        id,
      ],
    );

    // Ambil data terbaru
    const [updated] = await conn.query(
      "SELECT * FROM ujian_sabuk WHERE id = ?",
      [id],
    );

    return res.status(200).json({
      message: "Ujian sabuk berhasil diperbarui",
      data: updated[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal memperbarui ujian sabuk",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
