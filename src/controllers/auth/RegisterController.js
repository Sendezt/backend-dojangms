// src/controllers/auth/RegisterController.js

const db = require("../../config/database");
const bcrypt = require("bcrypt");

exports.Register = async (req, res) => {
  const { name, email, password, phone, tanggal_lahir, belt_id } = req.body;

  if (!name || !email || !password || !tanggal_lahir) {
    return res.status(400).json({
      message: "Nama, email, password, dan tanggal lahir wajib diisi",
    });
  }

  // Validasi tanggal lahir
  const parsedDate = new Date(tanggal_lahir);
  if (isNaN(parsedDate.getTime())) {
    return res.status(400).json({
      message: "Format tanggal lahir tidak valid",
    });
  }

  const tahun_lahir = parsedDate.getFullYear();

  // ==========================
  // Validasi Nomor Telepon
  // ==========================
  let normalizedPhone = null;

  if (phone) {
    // Hilangkan semua karakter selain angka dan +
    normalizedPhone = phone.replace(/[\s-]/g, "");

    // Ubah +62 menjadi 62
    if (normalizedPhone.startsWith("+62")) {
      normalizedPhone = normalizedPhone.replace("+62", "62");
    }

    // Ubah 08xxxx menjadi 628xxxx
    if (normalizedPhone.startsWith("0")) {
      normalizedPhone = "62" + normalizedPhone.substring(1);
    }

    // Validasi nomor seluler Indonesia
    const phoneRegex = /^628[1-9][0-9]{7,11}$/;

    if (!phoneRegex.test(normalizedPhone)) {
      return res.status(400).json({
        message:
          "Nomor telepon tidak valid. Gunakan nomor seluler Indonesia yang aktif.",
      });
    }
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // Cek email
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

    // Insert user
    const [userResult] = await conn.query(
      `INSERT INTO users
      (name, email, password, phone, tanggal_lahir, tahun_lahir, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [
        name,
        email,
        hashedPassword,
        normalizedPhone,
        tanggal_lahir,
        tahun_lahir,
      ],
    );

    const userId = userResult.insertId;

    // Ambil role murid
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

    // Tentukan belt awal
    let selectedBeltId = belt_id;

    if (belt_id) {
      const [[belt]] = await conn.query(
        "SELECT id FROM belts WHERE id = ?",
        [belt_id],
      );

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

    // Insert belt pertama
    await conn.query(
      `INSERT INTO user_belts
      (user_id, belt_id, is_current, achieved_at)
      VALUES (?, ?, true, CURDATE())`,
      [userId, selectedBeltId],
    );

    await conn.commit();

    return res.status(201).json({
      message:
        "Registrasi berhasil. Silakan tunggu akun Anda diverifikasi oleh admin.",
      data: {
        id: userId,
        name,
        email,
        phone: normalizedPhone,
        tanggal_lahir,
        tahun_lahir,
        role: "murid",
        status: "pending",
      },
    });
  } catch (error) {
    await conn.rollback();

    return res.status(500).json({
      message: "Gagal melakukan registrasi",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};