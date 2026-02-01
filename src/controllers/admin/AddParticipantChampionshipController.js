const db = require("../../config/database");

exports.addParticipant = async (req, res) => {
  const { championship_id } = req.params;
  const { user_id, competition_class_id } = req.body;

  if (!championship_id || !user_id || !competition_class_id) {
    return res.status(400).json({
      message: "championship_id, user_id, dan competition_class_id wajib diisi",
    });
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // ===== CEK KEJUARAAN =====
    const [[championship]] = await conn.query(
      "SELECT id FROM kejuaraan WHERE id = ?",
      [championship_id],
    );

    if (!championship) {
      await conn.rollback();
      return res.status(404).json({
        message: "Kejuaraan tidak ditemukan",
      });
    }

    // ===== CEK USER =====
    const [[user]] = await conn.query(
      "SELECT id, status, tahun_lahir FROM users WHERE id = ?",
      [user_id],
    );

    if (!user) {
      await conn.rollback();
      return res.status(404).json({
        message: "User tidak ditemukan",
      });
    }

    if (user.status !== "active") {
      await conn.rollback();
      return res.status(400).json({
        message: "User tidak aktif",
      });
    }

    // ===== CEK ROLE MURID =====
    const [[muridRole]] = await conn.query(
      `
      SELECT ur.user_id
      FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = ? AND r.name = 'murid'
      `,
      [user_id],
    );

    if (!muridRole) {
      await conn.rollback();
      return res.status(403).json({
        message: "User bukan murid",
      });
    }

    // ===== CEK BELT AKTIF =====
    const [[belt]] = await conn.query(
      `
      SELECT belt_id
      FROM user_belts
      WHERE user_id = ? AND is_current = 1
      `,
      [user_id],
    );

    if (!belt) {
      await conn.rollback();
      return res.status(400).json({
        message: "User belum memiliki belt aktif",
      });
    }

    // ===== CEK KELAS PERTANDINGAN =====
    const [[competitionClass]] = await conn.query(
      `
      SELECT cc.id, tk.code AS tipe
      FROM competition_classes cc
      JOIN tipe_kejuaraan tk ON tk.id = cc.tipe_kejuaraan_id
      WHERE cc.id = ?
      `,
      [competition_class_id],
    );

    if (!competitionClass) {
      await conn.rollback();
      return res.status(404).json({
        message: "Kelas pertandingan tidak ditemukan",
      });
    }

    // ===== CEK KELAS TERSEDIA DI KEJUARAAN =====
    const [[classInChampionship]] = await conn.query(
      `
      SELECT id
      FROM championship_classes
      WHERE kejuaraan_id = ? AND competition_class_id = ?
      `,
      [championship_id, competition_class_id],
    );

    if (!classInChampionship) {
      await conn.rollback();
      return res.status(400).json({
        message: "Kelas pertandingan tidak dibuka di kejuaraan ini",
      });
    }

    // ===== CEK SUDAH TERDAFTAR =====
    const [[exists]] = await conn.query(
      `
      SELECT championship_id
      FROM peserta_kejuaraan
      WHERE championship_id = ? AND user_id = ?
      `,
      [championship_id, user_id],
    );

    if (exists) {
      await conn.rollback();
      return res.status(409).json({
        message: "User sudah terdaftar di kejuaraan ini",
      });
    }

    // ===== VALIDASI UMUR PESERTA =====
    const [[ageRule]] = await conn.query(
      `
        SELECT ac.min_age, ac.max_age
        FROM competition_classes cc
        JOIN age_classes ac ON ac.id = cc.age_class_id
        WHERE cc.id = ?
      `,
      [competition_class_id],
    );

    if (!ageRule) {
      await conn.rollback();
      return res.status(400).json({
        message: "Kelas umur tidak valid",
      });
    }

    // ambil tahun kejuaraan
    const [[champYear]] = await conn.query(
      `
        SELECT year, start_date
        FROM kejuaraan
        WHERE id = ?
      `,
      [championship_id],
    );

    const eventYear =
      champYear.year ?? new Date(champYear.start_date).getFullYear();

    const userAge = eventYear - user.tahun_lahir;

    if (userAge < ageRule.min_age || userAge > ageRule.max_age) {
      await conn.rollback();
      return res.status(400).json({
        message: `Umur peserta (${userAge} tahun) tidak sesuai dengan kelas umur (${ageRule.min_age}-${ageRule.max_age})`,
      });
    }

    // ===== INSERT PESERTA =====
    await conn.query(
      `
      INSERT INTO peserta_kejuaraan
      (championship_id, user_id, belt_id, competition_class_id)
      VALUES (?, ?, ?, ?)
      `,
      [championship_id, user_id, belt.belt_id, competition_class_id],
    );

    await conn.commit();

    res.status(201).json({
      message: "Peserta berhasil ditambahkan ke kejuaraan",
      data: {
        championship_id,
        user_id,
        competition_class_id,
        belt_id: belt.belt_id,
        tipe_kejuaraan: competitionClass.tipe,
      },
    });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({
      message: "Gagal menambahkan peserta",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
