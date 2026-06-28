const db = require("../../config/database");
const bcrypt = require("bcrypt");

/**
 * GET /api/user/profile
 * Ambil data profil user yang sedang login
 */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      `SELECT 
        u.id, u.name, u.email, u.phone, u.foto, u.alamat, 
        u.jenis_kelamin, u.nama_wali, u.no_wali, u.tanggal_lahir, 
        u.status, u.created_at, u.updated_at,
        GROUP_CONCAT(r.name) AS roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       WHERE u.id = ?
       GROUP BY u.id`,
      [userId],
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }

    const user = rows[0];
    // Parse roles menjadi array
    user.roles = user.roles ? user.roles.split(",") : [];

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil profil",
      error: error.message,
    });
  }
};

exports.updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { name, email, phone, alamat, jenis_kelamin, nama_wali, no_wali } =
    req.body;
  const fotoPath = req.file ? `uploads/users/${req.file.filename}` : undefined;

  // Validasi minimal satu field
  if (
    name === undefined &&
    email === undefined &&
    phone === undefined &&
    alamat === undefined &&
    jenis_kelamin === undefined &&
    nama_wali === undefined &&
    no_wali === undefined &&
    fotoPath === undefined
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Tidak ada data yang diupdate" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Cek user
    const [user] = await conn.query(
      "SELECT id, email FROM users WHERE id = ?",
      [userId],
    );
    if (user.length === 0) {
      await conn.rollback();
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }

    // Cek email unik
    if (email && email !== user[0].email) {
      const [existing] = await conn.query(
        "SELECT id FROM users WHERE email = ? AND id != ?",
        [email, userId],
      );
      if (existing.length > 0) {
        await conn.rollback();
        return res
          .status(409)
          .json({ success: false, message: "Email sudah digunakan" });
      }
    }

    // Validasi jenis_kelamin
    if (jenis_kelamin && !["laki-laki", "perempuan"].includes(jenis_kelamin)) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: "jenis_kelamin harus 'laki-laki' atau 'perempuan'",
      });
    }

    // Build update query
    const fields = [];
    const values = [];

    const pushField = (col, val) => {
      if (val !== undefined) {
        fields.push(`${col} = ?`);
        values.push(val === "" ? null : val);
      }
    };

    pushField("name", name);
    pushField("email", email);
    pushField("phone", phone);
    pushField("alamat", alamat);
    pushField("jenis_kelamin", jenis_kelamin);
    pushField("nama_wali", nama_wali);
    pushField("no_wali", no_wali);
    if (fotoPath) pushField("foto", fotoPath);

    // Tambahkan updated_at
    fields.push("updated_at = NOW()");

    const query = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;
    values.push(userId);
    await conn.query(query, values);

    await conn.commit();

    // Ambil data terbaru
    const [updated] = await conn.query(
      `SELECT id, name, email, phone, foto, alamat, jenis_kelamin, nama_wali, no_wali, tanggal_lahir, status
       FROM users WHERE id = ?`,
      [userId],
    );

    // Ambil role
    const [roles] = await conn.query(
      `SELECT r.name FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = ?`,
      [userId],
    );

    return res.status(200).json({
      success: true,
      message: "Profil berhasil diperbarui",
      data: {
        ...updated[0],
        roles: roles.map((r) => r.name),
        foto: updated[0].foto
          ? `${process.env.BASE_URL || ""}/${updated[0].foto}`
          : null,
      },
    });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal update profil",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
