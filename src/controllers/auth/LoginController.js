const db = require("../../config/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email dan password wajib diisi",
    });
  }

  const conn = await db.getConnection();

  try {
    // Cek user
    const [[user]] = await conn.query(
      `
      SELECT id, name, email, password, status
      FROM users
      WHERE email = ?
      `,
      [email],
    );

    // Email atau password salah (disamakan)
    if (!user) {
      return res.status(401).json({
        message: "Email atau password salah",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        message: "Akun tidak aktif",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Email atau password salah",
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
      [user.id],
    );

    // Ambil sabuk aktif
    const [[belt]] = await conn.query(
      `
      SELECT b.name, b.dan_level, ub.achieved_at
      FROM user_belts ub
      JOIN belts b ON b.id = ub.belt_id
      WHERE ub.user_id = ? AND ub.is_current = true
      `,
      [user.id],
    );

    // Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        roles: roles.map((r) => r.name),
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.json({
      message: "Login berhasil",
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          roles: roles.map((r) => r.name),
          current_belt: belt || null,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Login gagal",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
