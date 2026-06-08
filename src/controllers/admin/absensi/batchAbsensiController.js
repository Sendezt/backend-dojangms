const db = require("../../../config/database");

exports.batchAbsensi = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { kelas_id, tanggal, jadwal_id, absensi_list } = req.body;
    const dicatat_oleh = req.user.id;

    // 1. Validasi dasar
    if (!kelas_id || isNaN(kelas_id) || kelas_id < 1) {
      return res.status(400).json({ message: "kelas_id tidak valid" });
    }
    if (!tanggal || isNaN(Date.parse(tanggal))) {
      return res
        .status(400)
        .json({ message: "tanggal harus format YYYY-MM-DD" });
    }
    if (
      !absensi_list ||
      !Array.isArray(absensi_list) ||
      absensi_list.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "absensi_list harus berupa array non-kosong" });
    }
    const allowedStatus = ["hadir", "izin", "sakit", "alpha"];
    for (let item of absensi_list) {
      if (!item.user_id || isNaN(item.user_id) || item.user_id < 1) {
        return res
          .status(400)
          .json({ message: "Setiap item harus memiliki user_id valid" });
      }
      if (!item.status || !allowedStatus.includes(item.status)) {
        return res
          .status(400)
          .json({ message: `Status tidak valid: ${item.status}` });
      }
    }

    // 2. Cek kelas
    const [kelas] = await conn.query("SELECT id FROM kelas WHERE id = ?", [
      kelas_id,
    ]);
    if (kelas.length === 0) {
      return res.status(404).json({ message: "Kelas tidak ditemukan" });
    }

    // 3. Validasi jadwal (wajib)
    if (!jadwal_id) {
      return res.status(400).json({ message: "jadwal_id wajib diisi" });
    }
    const [jadwalRows] = await conn.query(
      `SELECT id, tipe, hari, kelas_id, effective_from, effective_until,
              tanggal_mulai, tanggal_selesai
       FROM jadwal WHERE id = ? AND status = 'aktif'`,
      [jadwal_id],
    );
    if (jadwalRows.length === 0) {
      return res
        .status(404)
        .json({ message: "Jadwal tidak ditemukan atau tidak aktif" });
    }
    const jadwal = jadwalRows[0];

    if (jadwal.kelas_id !== kelas_id) {
      return res
        .status(400)
        .json({ message: "Jadwal tidak sesuai dengan kelas" });
    }

    // 4. Validasi tanggal berdasarkan tipe jadwal
    const tgl = new Date(tanggal);

    // Untuk jadwal yang memiliki hari (latihan_wajib / kelas)
    if (jadwal.tipe !== "training_camp" && jadwal.hari) {
      // 4a. Validasi hari
      const dayMap = {
        senin: 1,
        selasa: 2,
        rabu: 3,
        kamis: 4,
        jumat: 5,
        sabtu: 6,
        minggu: 7,
      };
      const jsDayToCustom = { 0: 7, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6 };
      const inputDay = tgl.getDay();
      if (jsDayToCustom[inputDay] !== dayMap[jadwal.hari]) {
        return res.status(400).json({
          message: `Tanggal ${tanggal} tidak sesuai dengan hari jadwal (${jadwal.hari})`,
        });
      }
      // 4b. Validasi rentang efektif
      const effFrom = jadwal.effective_from
        ? new Date(jadwal.effective_from)
        : null;
      const effUntil = jadwal.effective_until
        ? new Date(jadwal.effective_until)
        : null;
      if (effFrom && tgl < effFrom) {
        return res.status(400).json({
          message: `Tanggal ${tanggal} sebelum tanggal mulai efektif (${jadwal.effective_from})`,
        });
      }
      if (effUntil && tgl > effUntil) {
        return res.status(400).json({
          message: `Tanggal ${tanggal} setelah tanggal akhir efektif (${jadwal.effective_until})`,
        });
      }
    }

    // Untuk jadwal training_camp (one-time)
    if (jadwal.tipe === "training_camp") {
      if (jadwal.tanggal_mulai && jadwal.tanggal_selesai) {
        const mulai = new Date(jadwal.tanggal_mulai);
        const selesai = new Date(jadwal.tanggal_selesai);
        if (tgl < mulai || tgl > selesai) {
          return res.status(400).json({
            message: `Tanggal ${tanggal} di luar rentang training camp (${jadwal.tanggal_mulai} s.d ${jadwal.tanggal_selesai})`,
          });
        }
      }
    }

    // 5. Ambil daftar murid aktif di kelas
    const [muridKelas] = await conn.query(
      `SELECT user_id FROM kelas_murid WHERE kelas_id = ? AND status = 'aktif'`,
      [kelas_id],
    );
    const validMuridIds = muridKelas.map((m) => m.user_id);
    const inputMuridIds = absensi_list.map((a) => a.user_id);
    const invalidMurid = inputMuridIds.filter(
      (id) => !validMuridIds.includes(id),
    );
    if (invalidMurid.length > 0) {
      return res
        .status(400)
        .json({
          message: `Murid tidak terdaftar di kelas: ${invalidMurid.join(", ")}`,
        });
    }

    // 6. Cek duplikasi absensi
    const placeholders = inputMuridIds.map(() => "?").join(",");
    const [existing] = await conn.query(
      `SELECT user_id FROM absensi WHERE kelas_id = ? AND tanggal = ? AND user_id IN (${placeholders})`,
      [kelas_id, tanggal, ...inputMuridIds],
    );
    const existingUserIds = existing.map((e) => e.user_id);
    const newAbsensiList = absensi_list.filter(
      (a) => !existingUserIds.includes(a.user_id),
    );
    if (newAbsensiList.length === 0) {
      return res
        .status(409)
        .json({
          message: "Semua murid sudah memiliki absensi pada tanggal ini",
        });
    }

    // 7. Insert batch
    const insertValues = newAbsensiList.map((a) => [
      kelas_id,
      jadwal_id,
      a.user_id,
      tanggal,
      a.status,
      a.catatan || null,
      dicatat_oleh,
      new Date(),
    ]);
    await conn.query(
      `INSERT INTO absensi (kelas_id, jadwal_id, user_id, tanggal, status, catatan, dicatat_oleh, created_at) VALUES ?`,
      [insertValues],
    );

    // 8. Ambil data yang baru masuk
    const newUserIds = newAbsensiList.map((a) => a.user_id);
    const newPlaceholders = newUserIds.map(() => "?").join(",");
    const [insertedRows] = await conn.query(
      `SELECT id, kelas_id, jadwal_id, user_id, tanggal, status, catatan, dicatat_oleh, created_at
       FROM absensi WHERE kelas_id = ? AND tanggal = ? AND user_id IN (${newPlaceholders})`,
      [kelas_id, tanggal, ...newUserIds],
    );

    return res.status(201).json({
      message: `Berhasil mencatat absensi untuk ${insertedRows.length} murid`,
      summary: {
        total_input: absensi_list.length,
        total_success: insertedRows.length,
        total_failed: existingUserIds.length + invalidMurid.length,
      },
      details: {
        success: insertedRows,
        failed: {
          already_exist: existingUserIds,
          not_in_class: invalidMurid,
        },
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal menyimpan absensi",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
