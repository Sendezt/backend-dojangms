const db = require("../../config/database");

exports.getAllUsers = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const [rows] = await conn.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.status,
        u.created_at,

        roles.roles,
        belt.current_belt,
        belt.belt_achieved_at

      FROM users u

      LEFT JOIN (
        SELECT 
          ur.user_id,
          GROUP_CONCAT(r.name ORDER BY r.name SEPARATOR ', ') AS roles
        FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        GROUP BY ur.user_id
      ) roles ON roles.user_id = u.id

      LEFT JOIN (
        SELECT 
          ub.user_id,
          b.name AS current_belt,
          ub.achieved_at AS belt_achieved_at
        FROM user_belts ub
        JOIN belts b ON b.id = ub.belt_id
        WHERE ub.is_current = true
      ) belt ON belt.user_id = u.id

      ORDER BY u.created_at DESC
    `);

    // Kondisi data kosong
    if (rows.length === 0) {
      return res.json({
        message: "Data user masih kosong",
        data: [],
      });
    }

    res.json({
      message: "Berhasil mengambil semua user",
      data: rows,
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
