const db = require("../../../config/database");

// Helper: cek bentrok recurring (latihan_wajib / kelas recurring) dengan exclude ID
async function checkConflictRecurringUpdate(
  conn,
  id,
  hari,
  jam_mulai,
  jam_selesai,
  lokasi,
  effective_from,
  effective_until,
  kelas_id = null,
) {
  let sql = `
    SELECT id, effective_from, effective_until, status
    FROM jadwal
    WHERE tipe IN ('latihan_wajib', 'kelas')
      AND hari = ?
      AND lokasi = ?
      AND status = 'aktif'
      AND id != ?
      AND (
        (jam_mulai < ? AND jam_selesai > ?) OR
        (jam_mulai < ? AND jam_selesai > ?) OR
        (jam_mulai >= ? AND jam_mulai < ?)
      )
  `;
  let params = [
    hari,
    lokasi,
    id,
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

// Helper: cek bentrok one-time (training_camp atau kelas one-time) dengan exclude ID
async function checkConflictOneTimeUpdate(
  conn,
  id,
  tanggal_mulai,
  tanggal_selesai,
  jam_mulai,
  jam_selesai,
  lokasi,
  kelas_id = null,
) {
  let sql = `
    SELECT id FROM jadwal
    WHERE (tipe = 'training_camp' OR (tipe = 'kelas' AND hari IS NULL))
      AND lokasi = ?
      AND status = 'aktif'
      AND id != ?
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
    id,
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
  const [rows] = await conn.query(sql, params);
  return rows.length > 0;
}

exports.updateJadwal = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id < 1) {
      return res.status(400).json({ message: "ID jadwal tidak valid" });
    }

    // Ambil data jadwal yang ada
    const [existing] = await conn.query("SELECT * FROM jadwal WHERE id = ?", [
      id,
    ]);
    if (existing.length === 0) {
      return res.status(404).json({ message: "Jadwal tidak ditemukan" });
    }
    const current = existing[0];
    const tipe = current.tipe;

    let {
      nama,
      hari,
      effective_from,
      effective_until,
      tanggal_mulai,
      tanggal_selesai,
      tanggal,
      jam_mulai,
      jam_selesai,
      lokasi,
      keterangan,
      status,
      kelas_id,
    } = req.body;

    // Minimal satu field dikirim
    const fieldsToUpdate = [
      "nama",
      "hari",
      "effective_from",
      "effective_until",
      "tanggal_mulai",
      "tanggal_selesai",
      "tanggal",
      "jam_mulai",
      "jam_selesai",
      "lokasi",
      "keterangan",
      "status",
      "kelas_id",
    ];
    const hasAny = fieldsToUpdate.some(
      (field) => req.body[field] !== undefined,
    );
    if (!hasAny) {
      return res
        .status(400)
        .json({ message: "Minimal satu field harus diupdate" });
    }

    // Validasi status
    if (status && !["aktif", "nonaktif"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Status harus 'aktif' atau 'nonaktif'" });
    }

    // Validasi umum
    if (
      nama !== undefined &&
      (typeof nama !== "string" || nama.trim() === "")
    ) {
      return res
        .status(400)
        .json({ message: "Nama jadwal harus string tidak kosong" });
    }
    if (
      jam_mulai !== undefined &&
      jam_selesai !== undefined &&
      jam_mulai >= jam_selesai
    ) {
      return res
        .status(400)
        .json({ message: "Jam selesai harus setelah jam mulai" });
    }
    if (
      jam_mulai !== undefined &&
      (jam_mulai < "00:00" || jam_mulai > "23:59")
    ) {
      return res.status(400).json({ message: "Format jam mulai tidak valid" });
    }
    if (
      jam_selesai !== undefined &&
      (jam_selesai < "00:00" || jam_selesai > "23:59")
    ) {
      return res
        .status(400)
        .json({ message: "Format jam selesai tidak valid" });
    }
    if (
      lokasi !== undefined &&
      (typeof lokasi !== "string" || lokasi.trim() === "")
    ) {
      return res
        .status(400)
        .json({ message: "Lokasi harus string tidak kosong" });
    }

    // ========== Validasi khusus per tipe ==========
    if (tipe === "latihan_wajib") {
      if (
        hari !== undefined &&
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
      if (effective_from !== undefined && isNaN(Date.parse(effective_from))) {
        return res
          .status(400)
          .json({ message: "effective_from format tidak valid" });
      }
      if (
        effective_until !== undefined &&
        effective_until !== null &&
        isNaN(Date.parse(effective_until))
      ) {
        return res
          .status(400)
          .json({ message: "effective_until format tidak valid" });
      }
      if (
        effective_from !== undefined &&
        effective_until !== undefined &&
        effective_until &&
        new Date(effective_until) < new Date(effective_from)
      ) {
        return res
          .status(400)
          .json({ message: "effective_until harus setelah effective_from" });
      }
    }

    if (tipe === "training_camp") {
      if (tanggal_mulai !== undefined && isNaN(Date.parse(tanggal_mulai))) {
        return res
          .status(400)
          .json({ message: "tanggal_mulai format tidak valid" });
      }
      if (tanggal_selesai !== undefined && isNaN(Date.parse(tanggal_selesai))) {
        return res
          .status(400)
          .json({ message: "tanggal_selesai format tidak valid" });
      }
      if (
        tanggal_mulai !== undefined &&
        tanggal_selesai !== undefined &&
        new Date(tanggal_mulai) > new Date(tanggal_selesai)
      ) {
        return res
          .status(400)
          .json({ message: "tanggal_selesai harus setelah tanggal_mulai" });
      }
    }

    if (tipe === "kelas") {
      // Normalisasi nilai hari: jika "" atau "null" atau null, set jadi null (one-time)
      let normalizedHari = hari;
      if (hari === "" || hari === "null") normalizedHari = null;

      // Validasi: jika hari tidak null & tidak undefined, harus enum yang valid
      if (
        normalizedHari !== undefined &&
        normalizedHari !== null &&
        ![
          "senin",
          "selasa",
          "rabu",
          "kamis",
          "jumat",
          "sabtu",
          "minggu",
        ].includes(normalizedHari)
      ) {
        return res.status(400).json({ message: "Hari tidak valid" });
      }

      // Validasi kelas_id
      let finalKelasId = kelas_id !== undefined ? kelas_id : current.kelas_id;
      if (finalKelasId && (isNaN(finalKelasId) || finalKelasId < 1)) {
        return res.status(400).json({ message: "kelas_id tidak valid" });
      }
      if (finalKelasId) {
        const [kelas] = await conn.query("SELECT id FROM kelas WHERE id = ?", [
          finalKelasId,
        ]);
        if (kelas.length === 0) {
          return res.status(404).json({ message: "Kelas tidak ditemukan" });
        }
      }

      // Validasi one-time vs recurring berdasarkan normalizedHari
      const isOneTime = normalizedHari === null;
      if (isOneTime) {
        // One-time kelas pengganti: wajib ada tanggal (atau tanggal_mulai/tanggal_selesai)
        if (tanggal !== undefined) {
          const parsedTanggal = new Date(tanggal);
          if (isNaN(parsedTanggal.getTime())) {
            return res
              .status(400)
              .json({ message: "Format tanggal tidak valid" });
          }
        } else if (
          tanggal_mulai !== undefined ||
          tanggal_selesai !== undefined
        ) {
          if (tanggal_mulai && isNaN(Date.parse(tanggal_mulai))) {
            return res
              .status(400)
              .json({ message: "tanggal_mulai format tidak valid" });
          }
          if (tanggal_selesai && isNaN(Date.parse(tanggal_selesai))) {
            return res
              .status(400)
              .json({ message: "tanggal_selesai format tidak valid" });
          }
          if (
            tanggal_mulai &&
            tanggal_selesai &&
            new Date(tanggal_mulai) > new Date(tanggal_selesai)
          ) {
            return res
              .status(400)
              .json({ message: "tanggal_selesai harus setelah tanggal_mulai" });
          }
        } else {
          return res.status(400).json({
            message:
              "Untuk kelas one-time, wajib mengirim field 'tanggal' (atau tanggal_mulai & tanggal_selesai)",
          });
        }
      } else {
        // Recurring
        if (effective_from !== undefined && isNaN(Date.parse(effective_from))) {
          return res
            .status(400)
            .json({ message: "effective_from format tidak valid" });
        }
        if (
          effective_until !== undefined &&
          effective_until !== null &&
          isNaN(Date.parse(effective_until))
        ) {
          return res
            .status(400)
            .json({ message: "effective_until format tidak valid" });
        }
        if (
          effective_from !== undefined &&
          effective_until !== undefined &&
          effective_until &&
          new Date(effective_until) < new Date(effective_from)
        ) {
          return res
            .status(400)
            .json({ message: "effective_until harus setelah effective_from" });
        }
      }
    }

    // ========== Siapkan final values ==========
    const finalNama = nama !== undefined ? nama.trim() : current.nama;
    const finalLokasi = lokasi !== undefined ? lokasi.trim() : current.lokasi;
    const finalJamMulai =
      jam_mulai !== undefined ? jam_mulai : current.jam_mulai;
    const finalJamSelesai =
      jam_selesai !== undefined ? jam_selesai : current.jam_selesai;
    const finalKeterangan =
      keterangan !== undefined ? keterangan : current.keterangan;
    const finalStatus = status !== undefined ? status : current.status;

    let finalHari = current.hari;
    let finalEffectiveFrom = current.effective_from;
    let finalEffectiveUntil = current.effective_until;
    let finalTanggalMulai = current.tanggal_mulai;
    let finalTanggalSelesai = current.tanggal_selesai;
    let finalKelasId = current.kelas_id;

    if (tipe === "latihan_wajib") {
      if (hari !== undefined) finalHari = hari;
      if (effective_from !== undefined) finalEffectiveFrom = effective_from;
      if (effective_until !== undefined)
        finalEffectiveUntil = effective_until === "" ? null : effective_until;
    } else if (tipe === "training_camp") {
      if (tanggal_mulai !== undefined) finalTanggalMulai = tanggal_mulai;
      if (tanggal_selesai !== undefined) finalTanggalSelesai = tanggal_selesai;
    } else if (tipe === "kelas") {
      let normalizedHari = hari;
      if (hari === "" || hari === "null") normalizedHari = null;
      if (normalizedHari !== undefined) finalHari = normalizedHari;
      if (kelas_id !== undefined)
        finalKelasId = kelas_id === "" ? null : kelas_id;

      const isOneTime = finalHari === null;
      if (isOneTime) {
        // Prioritas: tanggal > tanggal_mulai
        if (tanggal !== undefined) {
          finalTanggalMulai = tanggal;
          finalTanggalSelesai = tanggal;
        } else if (
          tanggal_mulai !== undefined ||
          tanggal_selesai !== undefined
        ) {
          finalTanggalMulai =
            tanggal_mulai !== undefined ? tanggal_mulai : tanggal_selesai;
          finalTanggalSelesai =
            tanggal_selesai !== undefined ? tanggal_selesai : tanggal_mulai;
        }
        // Untuk one-time, hapus field recurring
        finalEffectiveFrom = null;
        finalEffectiveUntil = null;
      } else {
        // Recurring
        if (effective_from !== undefined) finalEffectiveFrom = effective_from;
        if (effective_until !== undefined)
          finalEffectiveUntil = effective_until === "" ? null : effective_until;
        // Hapus field one-time
        finalTanggalMulai = null;
        finalTanggalSelesai = null;
      }
    }

    // ========== Cek bentrok jadwal ==========
    let isConflict = false;
    if (tipe === "latihan_wajib") {
      isConflict = await checkConflictRecurringUpdate(
        conn,
        id,
        finalHari,
        finalJamMulai,
        finalJamSelesai,
        finalLokasi,
        finalEffectiveFrom,
        finalEffectiveUntil,
        null,
      );
    } else if (tipe === "training_camp") {
      isConflict = await checkConflictOneTimeUpdate(
        conn,
        id,
        finalTanggalMulai,
        finalTanggalSelesai,
        finalJamMulai,
        finalJamSelesai,
        finalLokasi,
        null,
      );
    } else if (tipe === "kelas") {
      if (finalHari !== null) {
        isConflict = await checkConflictRecurringUpdate(
          conn,
          id,
          finalHari,
          finalJamMulai,
          finalJamSelesai,
          finalLokasi,
          finalEffectiveFrom,
          finalEffectiveUntil,
          finalKelasId,
        );
      } else {
        isConflict = await checkConflictOneTimeUpdate(
          conn,
          id,
          finalTanggalMulai,
          finalTanggalSelesai,
          finalJamMulai,
          finalJamSelesai,
          finalLokasi,
          finalKelasId,
        );
      }
    }

    if (isConflict) {
      return res.status(409).json({
        message: "Jadwal bentrok dengan jadwal lain di lokasi yang sama",
      });
    }

    // ========== Lakukan update ==========
    await conn.query(
      `UPDATE jadwal SET
        nama = ?, hari = ?, effective_from = ?, effective_until = ?,
        tanggal_mulai = ?, tanggal_selesai = ?, jam_mulai = ?, jam_selesai = ?,
        lokasi = ?, keterangan = ?, status = ?, kelas_id = ?
       WHERE id = ?`,
      [
        finalNama,
        finalHari,
        finalEffectiveFrom,
        finalEffectiveUntil,
        finalTanggalMulai,
        finalTanggalSelesai,
        finalJamMulai,
        finalJamSelesai,
        finalLokasi,
        finalKeterangan,
        finalStatus,
        finalKelasId,
        id,
      ],
    );

    // Ambil data terbaru
    const [updated] = await conn.query(
      `SELECT j.id, j.tipe, j.nama, j.kelas_id, j.hari, j.effective_from, j.effective_until,
              j.tanggal_mulai, j.tanggal_selesai, j.jam_mulai, j.jam_selesai,
              j.lokasi, j.keterangan, j.status, j.dibuat_oleh, j.created_at, j.updated_at,
              k.nama AS kelas_nama
       FROM jadwal j
       LEFT JOIN kelas k ON j.kelas_id = k.id
       WHERE j.id = ?`,
      [id],
    );

    return res.status(200).json({
      message: "Jadwal berhasil diperbarui",
      data: updated[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal memperbarui jadwal",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
