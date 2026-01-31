const db = require("../../config/database");
const bcrypt = require("bcrypt");

exports.Register = async (req, res) => {
  const { name, email, password, phone, tanggal_lahir, belt_id } = req.body;

  if (!name || !email || !password || !tanggal_lahir) {
    return res.status(400).json({
      message: "Nama, email, password, dan tanggal lahir wajib diisi",
    });
  }

  const parsedDate = new Date(tanggal_lahir);
  if (isNaN(parsedDate.getTime())) {
    return res.status(400).json({
      message: "Format tanggal lahir tidak valid",
    });
  }

  const tahun_lahir = parsedDate.getFullYear();

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

    const hashedPassword = await bcrypt.hash(password, 10);

    // insert users
    const [userResult] = await conn.query(
      `INSERT INTO users 
       (name, email, password, phone, tanggal_lahir, tahun_lahir, status)
       VALUES (?, ?, ?, ?, ?, ?, 'active')`,
      [name, email, hashedPassword, phone || null, tanggal_lahir, tahun_lahir],
    );

    const userId = userResult.insertId;

    // role murid
    const [[role]] = await conn.query(
      "SELECT id FROM roles WHERE name = 'murid'",
    );

    if (!role) throw new Error("Role murid tidak ditemukan");

    await conn.query(
      "INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)",
      [userId, role.id],
    );

    // belt
    let selectedBeltId = belt_id;

    if (belt_id) {
      const [[belt]] = await conn.query("SELECT id FROM belts WHERE id = ?", [
        belt_id,
      ]);
      if (!belt) {
        await conn.rollback();
        return res.status(400).json({ message: "Belt tidak valid" });
      }
    } else {
      const [[belt]] = await conn.query(
        "SELECT id FROM belts ORDER BY order_level ASC LIMIT 1",
      );
      selectedBeltId = belt.id;
    }

    await conn.query(
      `INSERT INTO user_belts 
       (user_id, belt_id, is_current, achieved_at)
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
        tanggal_lahir,
        tahun_lahir,
        role: "murid",
      },
    });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({
      message: "Gagal melakukan registrasi",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
