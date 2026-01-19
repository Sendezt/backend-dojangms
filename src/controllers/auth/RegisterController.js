const db = require("../../config/database");
const bcrypt = require("bcrypt");

exports.Register = async (req, res) => {
  const { name, email, password, phone, belt_id } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "Nama, email, dan password wajib diisi",
    });
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // cek email
    const [existing] = await conn.query(
      "SELECT id FROM users WHERE email = ?",
      [email],
    );

    if (existing.length > 0) {
      await conn.rollback();
      return res.status(409).json({
        message: "Email sudah terdaftar",
      });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // insert user
    const [userResult] = await conn.query(
      `INSERT INTO users (name, email, password, phone, status)
       VALUES (?,?,?,?, 'active')`,
      [name, email, hashedPassword, phone || null],
    );

    const userId = userResult.insertId;

    // ambil role murid
    const [[role]] = await conn.query(
      "SELECT id FROM roles WHERE name = 'murid'",
    );

    if (!role) {
      throw new Error("Role murid tidak ditemukan");
    }

    await conn.query(
      "INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)",
      [userId, role.id],
    );

    // ===== BELT LOGIC =====
    let selectedBeltId = belt_id;

    if (belt_id) {
      // cek belt valid
      const [[belt]] = await conn.query("SELECT id FROM belts WHERE id = ?", [
        belt_id,
      ]);

      if (!belt) {
        await conn.rollback();
        return res.status(400).json({
          message: "Belt tidak valid",
        });
      }
    } else {
      // default: sabuk paling rendah (putih)
      const [[belt]] = await conn.query(
        "SELECT id FROM belts ORDER BY order_level ASC LIMIT 1",
      );

      if (!belt) {
        throw new Error("Data belt tidak ditemukan");
      }

      selectedBeltId = belt.id;
    }

    // insert user_belts
    await conn.query(
      `INSERT INTO user_belts (user_id, belt_id, is_current, achieved_at)
       VALUES (?, ?, true, CURDATE())`,
      [userId, selectedBeltId],
    );

    await conn.commit();

    res.status(201).json({
      message: "Registrasi berhasil",
      data: {
        id: userId,
        name,
        email,
        role: "murid",
        belt_id: selectedBeltId,
      },
    });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({
      message: "Gagal melakukan registrasi",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
