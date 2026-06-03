// src\controllers\admin\user\CreateUserController.js
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
    belt_id,
    sertifikasi,
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

    // cek email sudah terdaftar
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

    // insert user
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

    const userId = userResult.insertId;

    // Ambil roles dari request, atau default ke murid
    let roleList = Array.isArray(roles) && roles.length > 0 ? roles : ["murid"];

    // Validasi permission: hanya admin yang bisa membuat admin/pelatih
    const [userRoles] = await conn.query(
      `SELECT r.name FROM user_roles ur 
       JOIN roles r ON ur.role_id = r.id 
       WHERE ur.user_id = ?`,
      [req.user?.id],
    );

    const isAdmin = userRoles.some((r) => r.name === "admin");

    // Cek apakah user coba buat admin tapi bukan admin
    if (roleList.includes("admin") && !isAdmin) {
      await conn.rollback();
      return res.status(403).json({
        message: "Hanya admin yang bisa membuat user dengan role admin",
      });
    }

    // Cek apakah user coba buat pelatih tapi bukan admin
    if (roleList.includes("pelatih") && !isAdmin) {
      await conn.rollback();
      return res.status(403).json({
        message: "Hanya admin yang bisa membuat user dengan role pelatih",
      });
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

    for (const role of validRoles) {
      await conn.query(
        "INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)",
        [userId, role.id],
      );
    }

    // handle pelatih
    if (roleList.includes("pelatih")) {
      await conn.query(
        `INSERT INTO pelatih (user_id, spesialisasi, sertifikasi) VALUES (?, ?, ?)`,
        [
          userId,
          req.body.spesialisasi || "kyorugi & poomsae",
          sertifikasi || null,
        ],
      );
    }

    // handle belt
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
