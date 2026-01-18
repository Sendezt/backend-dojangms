const db = require("../../config/database");
const bcrypt = require("bcrypt");

exports.createdUserByAdmin = async (req, res) => {
  const { name, email, password, phone, roles, belt_id, status } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "Name, email dan password wajib diisi",
    });
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // cek email unik,
    const [existing] = await conn.query("SELECT id FROM users WHERE email=?", [
      email,
    ]);

    if (existing.length > 0) {
      await conn.rollback();
      return res.status(409).json({
        message: "Email sudah terdaftar",
      });
    }

    // hash passsword
    const hashedpassword = await bcrypt.hash(password, 12);

    // insert users
    const [userResult] = await conn.query(
      `
            INSERT INTO users (name, email, password, phone, status)
            VALUES (?,?,?,?,?)
            `,
      [
        name,
        email,
        hashedpassword,
        phone || null,
        status === "inactive" ? "inactive" : "active",
      ]
    );

    const userId = userResult.insertId;

    // insert role
    const roleList =
      Array.isArray(roles) && roles.length > 0 ? roles : ["murid"];

    for (const roleName of roleList) {
      const [[role]] = await conn.query(`SELECT id FROM roles WHERE name = ?`, [
        roleName,
      ]);

      if (!role) {
        await conn.rollback();
        return res.status(400).json({
          message: `Role '${roleName}' tidak valid`,
        });
      }

      await conn.query(
        `INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)`,
        [userId, role.id]
      );
    }

    // Inser belt
    let selectedBeltId = belt_id;

    // Jika admin tidak menentukan belt -> default putih
    if (!selectedBeltId) {
      const [[belt]] = await conn.query(
        `SELECT id FROM belts ORDER BY order_level ASC LIMIT 1`
      );
      selectedBeltId = belt.id;
    }

    await conn.query(
      `
            INSERT INTO user_belts (user_id, belt_id, is_current, achieved_at)
            VALUES (?, ?, true, CURDATE())
            `,
      [userId, selectedBeltId]
    );

    await conn.commit();

    res.status(201).json({
      message: "User berhasil dibuat oleh admin",
      data: {
        id: userId,
        name,
        email,
        roles: roleList,
        belt_id: selectedBeltId,
        status: status || "active",
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
