const db = require("../../config/database");

const ALLOWED_CATEGORIES = ["kyorugi", "poomsae"];

exports.addParticipant = async (req, res) => {
  const championshipId = req.params.id;
  const { user_id, category } = req.body;

  try {
    // 1. Validasi input
    if (!user_id || !category) {
      return res.status(400).json({
        message: "user_id dan category wajib diisi",
      });
    }

    // 2. Validasi category
    if (!ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({
        message: "Category hanya boleh 'kyorugi' atau 'poomsae'",
      });
    }

    // 3. Cek championship
    const [championship] = await db.query(
      "SELECT id FROM championships WHERE id = ?",
      [championshipId],
    );

    if (championship.length === 0) {
      return res.status(404).json({
        message: "Kejuaraan tidak ditemukan",
      });
    }

    // 4. Cek user aktif & role murid
    const [validUser] = await db.query(
      `
      SELECT u.id
      FROM users u
      JOIN user_roles ur ON ur.user_id = u.id
      JOIN roles r ON r.id = ur.role_id
      WHERE u.id = ?
        AND u.status = 'active'
        AND r.name = 'murid'
      `,
      [user_id],
    );

    if (validUser.length === 0) {
      return res.status(403).json({
        message: "User harus aktif dan memiliki role murid",
      });
    }

    // 5. Ambil SABUK AKTIF
    const [currentBelt] = await db.query(
      `
      SELECT belt_id
      FROM user_belts
      WHERE user_id = ?
        AND is_current = 1
      LIMIT 1
      `,
      [user_id],
    );

    if (currentBelt.length === 0) {
      return res.status(400).json({
        message: "Murid belum memiliki sabuk aktif",
      });
    }

    const belt_id = currentBelt[0].belt_id;

    // 6. Cek duplikasi
    const [exists] = await db.query(
      `
      SELECT 1
      FROM championship_participants
      WHERE championship_id = ? AND user_id = ?
      `,
      [championshipId, user_id],
    );

    if (exists.length > 0) {
      return res.status(409).json({
        message: "Murid sudah terdaftar di kejuaraan ini",
      });
    }

    // 7. Insert peserta (belt_id otomatis)
    await db.query(
      `
      INSERT INTO championship_participants
      (championship_id, user_id, belt_id, category)
      VALUES (?, ?, ?, ?)
      `,
      [championshipId, user_id, belt_id, category],
    );

    return res.status(201).json({
      message: "Murid berhasil didaftarkan ke kejuaraan",
      data: {
        championship_id: championshipId,
        user_id,
        belt_id,
        category,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Terjadi kesalahan server",
    });
  }
};
