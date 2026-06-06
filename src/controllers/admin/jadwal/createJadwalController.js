const db = require("../../../config/database");

/**
 * Helper: cek bentrok jadwal untuk tipe latihan_wajib / kelas (recurring mingguan)
 * Cek apakah ada jadwal lain di lokasi yang sama, pada hari yang sama, jam overlap,
 * dan rentang tanggal efektif saling tumpang tindih.
 */
async function checkConflictRecurring(
  conn,
  hari,
  jam_mulai,
  jam_selesai,
  lokasi,
  effective_from,
  effective_until,
  excludeId = null,
  kelas_id = null,
) {
  let sql = `
    SELECT id, effective_from, effective_until, status
    FROM jadwal
    WHERE tipe IN ('latihan_wajib', 'kelas')
      AND hari = ?
      AND lokasi = ?
      AND status = 'aktif'
      AND (
        (jam_mulai < ? AND jam_selesai > ?) OR
        (jam_mulai < ? AND jam_selesai > ?) OR
        (jam_mulai >= ? AND jam_mulai < ?)
      )
  `;
  let params = [
    hari,
    lokasi,
    jam_selesai,
    jam_mulai,
    jam_mulai,
    jam_selesai,
    jam_mulai,
    jam_selesai,
  ];
  if (kelas_id !== null) {
    sql += ` AND kelas_id = ?`;
    params.push(kelas_id);
  }
  if (excludeId) {
    sql += ` AND id != ?`;
    params.push(excludeId);
  }
  const [rows] = await conn.query(sql, params);
  if (rows.length === 0) return false;

  // filter berdasarkan overlap tanggal efektif
  const newStart = new Date(effective_from);
  const newEnd = effective_until ? new Date(effective_until) : null;
  for (let row of rows) {
    const rowStart = new Date(row.effective_from);
    const rowEnd = row.effective_until ? new Date(row.effective_until) : null;
    if (newEnd && rowStart && newEnd < rowStart) continue;
    if (rowEnd && newStart && rowEnd < newStart) continue;
    return true; // overlap
  }
  return false;
}

/**
 * Helper: cek bentrok untuk training_camp (one-time range)
 */
async function checkConflictOneTime(
  conn,
  tanggal_mulai,
  tanggal_selesai,
  jam_mulai,
  jam_selesai,
  lokasi,
  excludeId = null,
) {
  const sql = `
    SELECT id FROM jadwal
    WHERE tipe = 'training_camp'
      AND lokasi = ?
      AND status = 'aktif'
      AND (
        (tanggal_mulai < ? AND tanggal_selesai > ?) OR
        (tanggal_mulai < ? AND tanggal_selesai > ?) OR
        (tanggal_mulai >= ? AND tanggal_mulai < ?)
      )
      AND (
        (jam_mulai < ? AND jam_selesai > ?) OR
        (jam_mulai < ? AND jam_selesai > ?) OR
        (jam_mulai >= ? AND jam_mulai < ?)
      )
  `;
  const params = [
    lokasi,
    tanggal_selesai,
    tanggal_mulai,
    tanggal_mulai,
    tanggal_selesai,
    tanggal_mulai,
    tanggal_selesai,
    jam_selesai,
    jam_mulai,
    jam_mulai,
    jam_selesai,
    jam_mulai,
    jam_selesai,
  ];
  if (excludeId) {
    return false; // untuk create tidak perlu exclude
  }
  const [rows] = await conn.query(sql, params);
  return rows.length > 0;
}

exports.createJadwal = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const {
      tipe, // 'latihan_wajib' | 'training_camp' | 'kelas'
      nama,
      kelas_id,
      hari, // untuk latihan_wajib & kelas
      effective_from,
      effective_until,
      tanggal_mulai, // untuk training_camp
      tanggal_selesai,
      jam_mulai,
      jam_selesai,
      lokasi,
      keterangan,
    } = req.body;

    // Validasi dasar
    if (!tipe || !["latihan_wajib", "training_camp", "kelas"].includes(tipe)) {
      return res.status(400).json({ message: "Tipe jadwal tidak valid" });
    }
    if (!nama || typeof nama !== "string" || nama.trim() === "") {
      return res.status(400).json({ message: "Nama jadwal wajib diisi" });
    }
    if (!jam_mulai || !jam_selesai) {
      return res
        .status(400)
        .json({ message: "Jam mulai dan jam selesai wajib diisi" });
    }
    if (jam_mulai >= jam_selesai) {
      return res
        .status(400)
        .json({ message: "Jam selesai harus setelah jam mulai" });
    }
    if (!lokasi || typeof lokasi !== "string" || lokasi.trim() === "") {
      return res.status(400).json({ message: "Lokasi wajib diisi" });
    }

    if (tipe === "latihan_wajib" || tipe === "kelas") {
      if (
        !hari ||
        ![
          "senin",
          "selasa",
          "rabu",
          "kamis",
          "jumat",
          "sabtu",
          "minggu",
        ].includes(hari)
      ) {
        return res
          .status(400)
          .json({ message: "Hari harus diisi dan valid (senin...minggu)" });
      }
      if (!effective_from || isNaN(Date.parse(effective_from))) {
        return res.status(400).json({
          message: "effective_from wajib dan format tanggal valid (YYYY-MM-DD)",
        });
      }
      if (effective_until && isNaN(Date.parse(effective_until))) {
        return res.status(400).json({
          message: "effective_until harus format tanggal valid jika diisi",
        });
      }
      if (
        effective_until &&
        new Date(effective_until) < new Date(effective_from)
      ) {
        return res
          .status(400)
          .json({ message: "effective_until harus setelah effective_from" });
      }
    }

    if (tipe === "training_camp") {
      if (!tanggal_mulai || !tanggal_selesai) {
        return res.status(400).json({
          message:
            "tanggal_mulai dan tanggal_selesai wajib untuk training_camp",
        });
      }
      if (
        isNaN(Date.parse(tanggal_mulai)) ||
        isNaN(Date.parse(tanggal_selesai))
      ) {
        return res.status(400).json({ message: "Format tanggal tidak valid" });
      }
      if (new Date(tanggal_mulai) > new Date(tanggal_selesai)) {
        return res.status(400).json({
          message:
            "tanggal_selesai harus setelah atau sama dengan tanggal_mulai",
        });
      }
    }

    // kelas_id untuk non-kelas
    let finalKelasId = kelas_id;
    if (tipe === "latihan_wajib" || tipe === "training_camp") {
      finalKelasId = null;
    } else if (tipe === "kelas") {
      if (!finalKelasId || isNaN(finalKelasId) || finalKelasId < 1) {
        return res
          .status(400)
          .json({ message: "kelas_id wajib diisi untuk tipe kelas" });
      }
      const [kelas] = await conn.query("SELECT id FROM kelas WHERE id = ?", [
        finalKelasId,
      ]);
      if (kelas.length === 0) {
        return res.status(404).json({ message: "Kelas tidak ditemukan" });
      }
    }

    // CEK BENTROK
    let isConflict = false;
    if (tipe === "latihan_wajib" || tipe === "kelas") {
      isConflict = await checkConflictRecurring(
        conn,
        hari,
        jam_mulai,
        jam_selesai,
        lokasi,
        effective_from,
        effective_until,
        null,
        tipe === "kelas" ? kelas_id : null,
      );
    } else if (tipe === "training_camp") {
      isConflict = await checkConflictOneTime(
        conn,
        tanggal_mulai,
        tanggal_selesai,
        jam_mulai,
        jam_selesai,
        lokasi,
      );
    }
    if (isConflict) {
      return res.status(409).json({
        message: "Jadwal bentrok dengan jadwal lain di lokasi yang sama",
      });
    }

    // INSERT
    const insertData = {
      tipe,
      nama: nama.trim(),
      kelas_id: finalKelasId,
      hari: tipe === "latihan_wajib" || tipe === "kelas" ? hari : null,
      effective_from:
        tipe === "latihan_wajib" || tipe === "kelas" ? effective_from : null,
      effective_until:
        tipe === "latihan_wajib" || tipe === "kelas"
          ? effective_until || null
          : null,
      tanggal_mulai: tipe === "training_camp" ? tanggal_mulai : null,
      tanggal_selesai: tipe === "training_camp" ? tanggal_selesai : null,
      jam_mulai,
      jam_selesai,
      lokasi: lokasi.trim(),
      keterangan: keterangan || null,
      status: "aktif",
      dibuat_oleh: req.user.id, // asumsi ada user dari middleware
    };

    const [result] = await conn.query("INSERT INTO jadwal SET ?", [insertData]);
    const [newJadwal] = await conn.query("SELECT * FROM jadwal WHERE id = ?", [
      result.insertId,
    ]);

    return res.status(201).json({
      message: "Jadwal berhasil dibuat",
      data: newJadwal[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal membuat jadwal",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
