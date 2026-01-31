const db = require("../../config/database");
const bcrypt = require("bcrypt");

exports.createUser = async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    tanggal_lahir,
    roles,
    belt_id,
    status,
  } = req.body;

  // ===== VALIDASI =====
  if (!name || !email || !password || !tanggal_lahir) {
    return res.status(400).json({
      message: "Name, email, password, dan tanggal lahir wajib diisi",
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

    // ===== CEK EMAIL =====
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

    // ===== HASH PASSWORD =====
    const hashedPassword = await bcrypt.hash(password, 12);

    // ===== INSERT USER =====
    const [userResult] = await conn.query(
      `
      INSERT INTO users 
      (name, email, password, phone, tanggal_lahir, tahun_lahir, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        name,
        email,
        hashedPassword,
        phone || null,
        tanggal_lahir,
        tahun_lahir,
        status === "inactive" ? "inactive" : "active",
      ],
    );

    const userId = userResult.insertId;

    // ===== ROLE =====
    const roleList =
      Array.isArray(roles) && roles.length > 0 ? roles : ["murid"];

    for (const roleName of roleList) {
      const [[role]] = await conn.query("SELECT id FROM roles WHERE name = ?", [
        roleName,
      ]);

      if (!role) {
        await conn.rollback();
        return res.status(400).json({
          message: `Role '${roleName}' tidak valid`,
        });
      }

      await conn.query(
        "INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)",
        [userId, role.id],
      );
    }

    // ===== BELT =====
    let selectedBeltId = belt_id;

    if (selectedBeltId) {
      const [[belt]] = await conn.query("SELECT id FROM belts WHERE id = ?", [
        selectedBeltId,
      ]);

      if (!belt) {
        await conn.rollback();
        return res.status(400).json({
          message: "Belt tidak valid",
        });
      }
    } else {
      const [[belt]] = await conn.query(
        "SELECT id FROM belts ORDER BY order_level ASC LIMIT 1",
      );

      if (!belt) {
        throw new Error("Data belt tidak ditemukan");
      }

      selectedBeltId = belt.id;
    }

    await conn.query(
      `
      INSERT INTO user_belts (user_id, belt_id, is_current, achieved_at)
      VALUES (?, ?, true, CURDATE())
      `,
      [userId, selectedBeltId],
    );

    await conn.commit();

    res.status(201).json({
      message: "User berhasil dibuat oleh admin",
      data: {
        id: userId,
        name,
        email,
        tanggal_lahir,
        tahun_lahir,
        roles: roleList,
        belt_id: selectedBeltId,
        status: status === "inactive" ? "inactive" : "active",
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
