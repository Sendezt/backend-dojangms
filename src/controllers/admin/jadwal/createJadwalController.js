// src/controllers/admin/jadwal/createJadwalController.js
const db = require("../../../config/database");

// Helper: cek bentrok jadwal recurring (latihan_wajib atau kelas recurring)
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
    SELECT id, effective_from, effective_until
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

  const newStart = new Date(effective_from);
  const newEnd = effective_until ? new Date(effective_until) : null;
  for (let row of rows) {
    const rowStart = new Date(row.effective_from);
    const rowEnd = row.effective_until ? new Date(row.effective_until) : null;
    if (newEnd && rowStart && newEnd < rowStart) continue;
    if (rowEnd && newStart && rowEnd < newStart) continue;
    return true;
  }
  return false;
}

// Helper: cek bentrok one-time (training_camp atau kelas one-time)
async function checkConflictOneTime(
  conn,
  tanggal_mulai,
  tanggal_selesai,
  jam_mulai,
  jam_selesai,
  lokasi,
  excludeId = null,
  kelas_id = null,
) {
  let sql = `
    SELECT id FROM jadwal
    WHERE (tipe = 'training_camp' OR (tipe = 'kelas' AND hari IS NULL))
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
  let params = [
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
  if (kelas_id !== null) {
    sql += ` AND kelas_id = ?`;
    params.push(kelas_id);
  }
  if (excludeId) {
    sql += ` AND id != ?`;
    params.push(excludeId);
  }
  const [rows] = await conn.query(sql, params);
  return rows.length > 0;
}

exports.createJadwal = async (req, res) => {
  const conn = await db.getConnection();
  try {
    let {
      tipe,
      nama,
      kelas_id,
      hari,
      effective_from,
      effective_until,
      tanggal_mulai,
      tanggal_selesai,
      tanggal, // PERUBAHAN: tambahan untuk one-time kelas
      jam_mulai,
      jam_selesai,
      lokasi,
      keterangan,
    } = req.body;

    // Validasi dasar (sama seperti kode asli)
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

    // Validasi kelas_id untuk tipe kelas
    let finalKelasId = null;
    if (tipe === "kelas") {
      if (!kelas_id || isNaN(kelas_id) || kelas_id < 1) {
        return res
          .status(400)
          .json({ message: "kelas_id wajib diisi untuk tipe kelas" });
      }
      const [kelas] = await conn.query("SELECT id FROM kelas WHERE id = ?", [
        kelas_id,
      ]);
      if (kelas.length === 0) {
        return res.status(404).json({ message: "Kelas tidak ditemukan" });
      }
      finalKelasId = kelas_id;
    }

    // Validasi spesifik tipe
    if (tipe === "latihan_wajib") {
      // ... (kode asli tidak berubah)
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
          .json({ message: "Hari wajib diisi untuk latihan_wajib" });
      }
      if (!effective_from || isNaN(Date.parse(effective_from))) {
        return res
          .status(400)
          .json({ message: "effective_from wajib format YYYY-MM-DD" });
      }
      if (effective_until && isNaN(Date.parse(effective_until))) {
        return res
          .status(400)
          .json({ message: "effective_until format tidak valid" });
      }
      if (
        effective_until &&
        new Date(effective_until) < new Date(effective_from)
      ) {
        return res
          .status(400)
          .json({ message: "effective_until harus setelah effective_from" });
      }
    } else if (tipe === "kelas") {
      if (hari) {
        // Recurring (kode asli)
        if (
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
          return res.status(400).json({ message: "Hari tidak valid" });
        }
        if (!effective_from || isNaN(Date.parse(effective_from))) {
          return res.status(400).json({
            message: "effective_from wajib untuk jadwal kelas recurring",
          });
        }
        if (effective_until && isNaN(Date.parse(effective_until))) {
          return res
            .status(400)
            .json({ message: "effective_until format tidak valid" });
        }
        if (
          effective_until &&
          new Date(effective_until) < new Date(effective_from)
        ) {
          return res
            .status(400)
            .json({ message: "effective_until harus setelah effective_from" });
        }
      } else {
        // PERUBAHAN: One-time (kelas pengganti) - cukup input tanggal
        if (!tanggal || isNaN(Date.parse(tanggal))) {
          return res.status(400).json({
            message:
              "Untuk jadwal kelas one-time, wajib mengisi tanggal (format YYYY-MM-DD)",
          });
        }
        // Set tanggal_mulai dan tanggal_selesai sama
        tanggal_mulai = tanggal;
        tanggal_selesai = tanggal;
        // Opsional: cek tanggal tidak boleh kurang dari hari ini
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (new Date(tanggal) < today) {
          return res
            .status(400)
            .json({ message: "Tanggal tidak boleh kurang dari hari ini" });
        }
      }
    } else if (tipe === "training_camp") {
      // ... (kode asli)
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

    // Cek bentrok (sama seperti kode asli, tidak berubah)
    let isConflict = false;
    if (tipe === "latihan_wajib" || (tipe === "kelas" && hari)) {
      isConflict = await checkConflictRecurring(
        conn,
        hari,
        jam_mulai,
        jam_selesai,
        lokasi,
        effective_from,
        effective_until,
        null,
        tipe === "kelas" ? finalKelasId : null,
      );
    } else {
      isConflict = await checkConflictOneTime(
        conn,
        tanggal_mulai,
        tanggal_selesai,
        jam_mulai,
        jam_selesai,
        lokasi,
        null,
        tipe === "kelas" ? finalKelasId : null,
      );
    }
    if (isConflict) {
      return res.status(409).json({
        message: "Jadwal bentrok dengan jadwal lain di lokasi yang sama",
      });
    }

    // Siapkan data insert
    let insertData = {
      tipe,
      nama: nama.trim(),
      kelas_id: finalKelasId,
      jam_mulai,
      jam_selesai,
      lokasi: lokasi.trim(),
      keterangan: keterangan || null,
      status: "aktif",
      dibuat_oleh: req.user.id,
    };

    if (tipe === "latihan_wajib") {
      insertData.hari = hari;
      insertData.effective_from = effective_from;
      insertData.effective_until = effective_until || null;
    } else if (tipe === "kelas") {
      if (hari) {
        insertData.hari = hari;
        insertData.effective_from = effective_from;
        insertData.effective_until = effective_until || null;
      } else {
        // PERUBAHAN: one-time kelas, simpan tanggal_mulai & tanggal_selesai
        insertData.hari = null;
        insertData.effective_from = null;
        insertData.effective_until = null;
        insertData.tanggal_mulai = tanggal_mulai;
        insertData.tanggal_selesai = tanggal_selesai;
      }
    } else if (tipe === "training_camp") {
      insertData.tanggal_mulai = tanggal_mulai;
      insertData.tanggal_selesai = tanggal_selesai;
      insertData.hari = null;
      insertData.effective_from = null;
      insertData.effective_until = null;
    }

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
