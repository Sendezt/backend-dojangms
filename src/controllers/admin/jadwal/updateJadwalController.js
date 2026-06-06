const db = require("../../../config/database");

// Helper: cek bentrok recurring (latihan_wajib / kelas) dengan exclude ID
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

// Helper: cek bentrok training_camp (one-time) dengan exclude ID
async function checkConflictOneTimeUpdate(
  conn,
  id,
  tanggal_mulai,
  tanggal_selesai,
  jam_mulai,
  jam_selesai,
  lokasi,
) {
  const sql = `
    SELECT id FROM jadwal
    WHERE tipe = 'training_camp'
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
  const params = [
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

    // Body request
    let {
      nama,
      hari,
      effective_from,
      effective_until,
      tanggal_mulai,
      tanggal_selesai,
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

    // Validasi tipe dan field dasar
    const tipe = current.tipe;
    if (status && !["aktif", "nonaktif"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Status harus 'aktif' atau 'nonaktif'" });
    }

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

    // Validasi khusus per tipe
    if (tipe === "latihan_wajib" || tipe === "kelas") {
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
        return res
          .status(400)
          .json({ message: "Hari harus valid (senin...minggu)" });
      }
      if (effective_from !== undefined && isNaN(Date.parse(effective_from))) {
        return res
          .status(400)
          .json({ message: "effective_from harus format tanggal valid" });
      }
      if (
        effective_until !== undefined &&
        effective_until !== null &&
        isNaN(Date.parse(effective_until))
      ) {
        return res
          .status(400)
          .json({ message: "effective_until harus format tanggal valid" });
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

    // Untuk tipe kelas, validasi kelas_id jika diubah
    if (tipe === "kelas") {
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
    }

    // Siapkan nilai final untuk update (gunakan current jika tidak diubah)
    const finalNama = nama !== undefined ? nama.trim() : current.nama;
    const finalHari =
      tipe === "latihan_wajib" || tipe === "kelas"
        ? hari !== undefined
          ? hari
          : current.hari
        : null;
    const finalEffectiveFrom =
      tipe === "latihan_wajib" || tipe === "kelas"
        ? effective_from !== undefined
          ? effective_from
          : current.effective_from
        : null;
    const finalEffectiveUntil =
      tipe === "latihan_wajib" || tipe === "kelas"
        ? effective_until !== undefined
          ? effective_until
          : current.effective_until
        : null;
    const finalTanggalMulai =
      tipe === "training_camp"
        ? tanggal_mulai !== undefined
          ? tanggal_mulai
          : current.tanggal_mulai
        : null;
    const finalTanggalSelesai =
      tipe === "training_camp"
        ? tanggal_selesai !== undefined
          ? tanggal_selesai
          : current.tanggal_selesai
        : null;
    const finalJamMulai =
      jam_mulai !== undefined ? jam_mulai : current.jam_mulai;
    const finalJamSelesai =
      jam_selesai !== undefined ? jam_selesai : current.jam_selesai;
    const finalLokasi = lokasi !== undefined ? lokasi.trim() : current.lokasi;
    const finalKeterangan =
      keterangan !== undefined ? keterangan : current.keterangan;
    const finalStatus = status !== undefined ? status : current.status;
    const finalKelasId =
      tipe === "kelas"
        ? kelas_id !== undefined
          ? kelas_id
          : current.kelas_id
        : null;

    // Cek bentrok jadwal (konflik)
    let isConflict = false;
    if (tipe === "latihan_wajib" || tipe === "kelas") {
      isConflict = await checkConflictRecurringUpdate(
        conn,
        id,
        finalHari,
        finalJamMulai,
        finalJamSelesai,
        finalLokasi,
        finalEffectiveFrom,
        finalEffectiveUntil,
        tipe === "kelas" ? finalKelasId : null,
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
      );
    }
    if (isConflict) {
      return res
        .status(409)
        .json({
          message: "Jadwal bentrok dengan jadwal lain di lokasi yang sama",
        });
    }

    // Lakukan update
    const updateData = {
      nama: finalNama,
      hari: finalHari,
      effective_from: finalEffectiveFrom,
      effective_until: finalEffectiveUntil,
      tanggal_mulai: finalTanggalMulai,
      tanggal_selesai: finalTanggalSelesai,
      jam_mulai: finalJamMulai,
      jam_selesai: finalJamSelesai,
      lokasi: finalLokasi,
      keterangan: finalKeterangan === null ? null : finalKeterangan,
      status: finalStatus,
      kelas_id: finalKelasId,
    };
    await conn.query("UPDATE jadwal SET ? WHERE id = ?", [updateData, id]);

    // Ambil data terbaru (join kelas untuk nama kelas)
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
