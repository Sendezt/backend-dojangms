// src/controllers/admin/kejuaraan/addBulkPesertaKejuaraanController.js
const db = require("../../../config/database");

exports.addBulkPesertaKejuaraan = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { kejuaraanId, kelasKejuaraanId } = req.params;
    const { peserta_list } = req.body; // array of user_id

    if (!kejuaraanId || isNaN(kejuaraanId)) {
      return res.status(400).json({ message: "ID kejuaraan tidak valid" });
    }
    if (!kelasKejuaraanId || isNaN(kelasKejuaraanId)) {
      return res
        .status(400)
        .json({ message: "ID kelas kejuaraan tidak valid" });
    }
    if (
      !peserta_list ||
      !Array.isArray(peserta_list) ||
      peserta_list.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "peserta_list harus berupa array tidak kosong" });
    }

    // 1. Ambil detail kelas kejuaraan (tipe, kelas_id)
    const [kelasRows] = await conn.query(
      `SELECT tipe, kelas_id FROM kelas_kejuaraan WHERE id = ?`,
      [kelasKejuaraanId],
    );
    if (kelasRows.length === 0) {
      return res
        .status(404)
        .json({ message: "Kelas kejuaraan tidak ditemukan" });
    }
    const { tipe, kelas_id } = kelasRows[0];

    // 2. Ambil aturan usia untuk kejuaraan ini
    const [usiaRules] = await conn.query(
      `SELECT kategori_usia_id, tahun_lahir_min, tahun_lahir_max
       FROM kejuaraan_kategori_usia
       WHERE kejuaraan_id = ?`,
      [kejuaraanId],
    );
    if (usiaRules.length === 0) {
      return res
        .status(400)
        .json({ message: "Kejuaraan belum memiliki aturan usia" });
    }

    // 3. Dapatkan kategori usia dari kelas (kyorugi atau poomsae)
    let requiredKategoriUsiaId = null;
    if (tipe === "kyorugi") {
      const [ky] = await conn.query(
        `SELECT kategori_usia_id FROM kelas_kyorugi WHERE id = ?`,
        [kelas_id],
      );
      if (ky.length === 0)
        return res
          .status(400)
          .json({ message: "Data kelas kyorugi tidak valid" });
      requiredKategoriUsiaId = ky[0].kategori_usia_id;
    } else if (tipe === "poomsae") {
      const [po] = await conn.query(
        `SELECT kategori_usia_id FROM kelas_poomsae WHERE id = ?`,
        [kelas_id],
      );
      if (po.length === 0)
        return res
          .status(400)
          .json({ message: "Data kelas poomsae tidak valid" });
      requiredKategoriUsiaId = po[0].kategori_usia_id;
    } else {
      return res.status(400).json({ message: "Tipe kelas tidak dikenal" });
    }

    // 4. Dapatkan aturan untuk kategori usia tersebut
    const rule = usiaRules.find(
      (r) => r.kategori_usia_id === requiredKategoriUsiaId,
    );
    if (!rule) {
      return res
        .status(400)
        .json({
          message: "Kejuaraan tidak memiliki aturan usia untuk kategori ini",
        });
    }

    await conn.beginTransaction();

    const success = [];
    const errors = [];

    for (const userId of peserta_list) {
      const uid = parseInt(userId);
      if (isNaN(uid)) {
        errors.push({ user_id: userId, error: "ID user tidak valid" });
        continue;
      }

      // 5. Cek data user (murid aktif, tahun lahir, sabuk saat ini)
      const [userRows] = await conn.query(
        `SELECT u.id, u.name, u.tahun_lahir, ub.belt_id AS belt_saat_ini
         FROM users u
         JOIN user_roles ur ON ur.user_id = u.id
         JOIN roles r ON r.id = ur.role_id
         LEFT JOIN user_belts ub ON ub.user_id = u.id AND ub.is_current = 1
         WHERE u.id = ? AND r.name = 'murid' AND u.status = 'active'`,
        [uid],
      );
      if (userRows.length === 0) {
        errors.push({
          user_id: uid,
          error: "User bukan murid atau tidak aktif",
        });
        continue;
      }
      const user = userRows[0];
      const tahunLahir = user.tahun_lahir;
      if (!tahunLahir) {
        errors.push({
          user_id: uid,
          name: user.name,
          error: "User tidak memiliki tahun lahir",
        });
        continue;
      }

      // 6. Validasi usia berdasarkan aturan
      let usiaValid = true;
      if (rule.tahun_lahir_min !== null && tahunLahir < rule.tahun_lahir_min)
        usiaValid = false;
      if (rule.tahun_lahir_max !== null && tahunLahir > rule.tahun_lahir_max)
        usiaValid = false;
      if (!usiaValid) {
        errors.push({
          user_id: uid,
          name: user.name,
          error: "Usia tidak memenuhi syarat untuk kategori ini",
        });
        continue;
      }

      // 7. Cek apakah sudah terdaftar di kelas kejuaraan yang sama
      const [exist] = await conn.query(
        `SELECT id FROM peserta_kejuaraan WHERE kelas_kejuaraan_id = ? AND user_id = ?`,
        [kelasKejuaraanId, uid],
      );
      if (exist.length > 0) {
        errors.push({
          user_id: uid,
          name: user.name,
          error: "Sudah terdaftar di kelas kejuaraan ini",
        });
        continue;
      }

      // 8. Insert peserta
      await conn.query(
        `INSERT INTO peserta_kejuaraan (kelas_kejuaraan_id, user_id, belt_id, hasil)
         VALUES (?, ?, ?, 'peserta')`,
        [kelasKejuaraanId, uid, user.belt_saat_ini || null],
      );

      success.push({
        user_id: uid,
        name: user.name,
        belt_id: user.belt_saat_ini,
      });
    }

    await conn.commit();

    return res.status(201).json({
      message: "Proses bulk peserta selesai",
      success_count: success.length,
      error_count: errors.length,
      success,
      errors,
    });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    return res.status(500).json({
      message: "Gagal menambahkan peserta secara bulk",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
