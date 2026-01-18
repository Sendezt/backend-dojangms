const db = require("../../config/database");
const bcrypt = require("bcrypt");

exports.Register = async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "Nama, email, dan password wajib diisi",
    });
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // Cek email sudah terdaftar
    const [existing] = await conn.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      await conn.rollback();
      return res.status(409).json({
        message: "Email sudah terdaftar",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert ke users
    const [userResult] = await conn.query(
      `INSERT INTO users (name, email, password, phone, status) VALUES (?,?,?,?,'active')`,
      [name, email, hashedPassword, phone || null]
    );

    const userId = userResult.insertId;

    // Ambil role murid
    const [[role]] = await conn.query(
      `SELECT id FROM roles WHERE name = 'murid'`
    );

    // insert ke user_roles
    await conn.query(`INSERT INTO user_roles (user_id, role_id) VALUES (?,?)`, [
      userId,
      role.id,
    ]);

    // ambil sabuk putih , order level = 1
    const [[belt]] = await conn.query(
      `SELECT id FROM belts WHERE order_level = 1`
    );

    // Insert ke user_belts
    await conn.query(
      `INSERT INTO user_belts (user_id, belt_id, is_current, achieved_at) VALUES (?,?,true,CURDATE())`,
      [userId, belt.id]
    );

    await conn.commit();

    res.status(201).json({
      message: "User berhasil dibuat",
      data: {
        id: userId,
        name,
        email,
        role: "murid",
        belt: "putih",
      },
    });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({
      message: "Gagal membuat user",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
