const db = require("../../../config/database");
const bcrypt = require("bcrypt");

exports.createUser = async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    tanggal_lahir,
    roles,
    status,
    belt_id, // ✅ FIX
  } = req.body;

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

    const hashedPassword = await bcrypt.hash(password, 12);

    // ===== INSERT USER =====
    const [userResult] = await conn.query(
      `INSERT INTO users 
       (name, email, password, phone, tanggal_lahir, tahun_lahir, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
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

    const userId = userResult.insertId; // ✅ FIX

    // ===== HANDLE ROLE =====
    let roleList = ["murid"];

    const isAdmin = req.user?.roles?.includes("admin");

    if (isAdmin && Array.isArray(roles) && roles.length > 0) {
      roleList = [...new Set(roles)];
    }

    const [validRoles] = await conn.query(
      "SELECT id, name FROM roles WHERE name IN (?)",
      [roleList],
    );

    if (validRoles.length !== roleList.length) {
      await conn.rollback();
      return res.status(400).json({
        message: "Ada role yang tidak valid",
      });
    }

    if (roleList.includes("admin") && !isAdmin) {
      await conn.rollback();
      return res.status(403).json({
        message: "Hanya admin yang bisa membuat admin",
      });
    }

    for (const role of validRoles) {
      await conn.query(
        "INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)",
        [userId, role.id],
      );
    }

    // ===== HANDLE PELATIH =====
    if (roleList.includes("pelatih")) {
      await conn.query(
        `INSERT INTO pelatih (user_id, created_at) VALUES (?, NOW())`,
        [userId],
      );
    }

    // ===== HANDLE BELT (PINDAH KE SINI) =====
    if (roleList.includes("murid") || roleList.includes("pelatih")) {
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

        if (!belt) throw new Error("Data belt tidak ditemukan");

        selectedBeltId = belt.id;
      }

      await conn.query(
        `INSERT INTO user_belts (user_id, belt_id, is_current, achieved_at)
         VALUES (?, ?, true, CURDATE())`,
        [userId, selectedBeltId],
      );
    }

    await conn.commit();

    return res.status(201).json({
      message: "User berhasil dibuat",
      data: {
        id: userId,
        name,
        email,
        roles: roleList,
      },
    });
  } catch (error) {
    await conn.rollback();
    return res.status(500).json({
      message: "Gagal membuat user",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
