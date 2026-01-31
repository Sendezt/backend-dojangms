const db = require("../../config/database");

exports.getUserById = async (req, res) => {
  const { id } = req.params;
  const conn = await db.getConnection();

  try {
    // Ambil data user
    const [[user]] = await conn.query(
      `
            SELECT id,name,email,phone,status,tanggal_lahir, created_at
            FROM users
            WHERE id = ?
            `,
      [id]
    );

    // Jika user tidak ditemukan
    if (!user) {
      return res.status(404).json({
        message: "User tidak ditemukan",
      });
    }

    // Ambil roles
    const [roles] = await conn.query(
      `
            SELECT r.name
            FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = ?
            `,
      [id]
    );

    // Ambil sabuk saat ini
    const [[currentBelt]] = await conn.query(
      `
            SELECT b.name, b.dan_level, ub.achieved_at
            FROM user_belts ub
            JOIN belts b ON b.id = ub.belt_id
            WHERE ub.user_id = ? AND ub.is_current = true
            `,
      [id]
    );

    // Ambil riwayat sabuk
    const [beltHistory] = await conn.query(
      `
            SELECT b.name, b.dan_level, ub.achieved_at, ub.is_current
            FROM user_belts ub
            JOIN belts b ON b.id = ub.belt_id
            WHERE ub.user_id = ?
            ORDER BY ub.achieved_at ASC
            `,
      [id]
    );

    res.json({
      message: "Berhasil mengambil data user",
      data: {
        ...user,
        roles: roles.map((r) => r.name),
        current_belt: currentBelt || null,
        belt_history: beltHistory,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil data user",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
