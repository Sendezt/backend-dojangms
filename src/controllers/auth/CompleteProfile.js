const db = require("../../config/database");

exports.CompleteProfile = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const { phone, alamat, jenis_kelamin, nama_wali, no_wali } = req.body;

  // kalau upload berhasil, multer akan isi req.file
  const fotoPath = req.file ? `uploads/users/${req.file.filename}` : undefined;

  const fields = [];
  const values = [];

  const pushField = (col, val) => {
    if (val !== undefined) {
      fields.push(`${col} = ?`);
      values.push(val === "" ? null : val);
    }
  };

  pushField("phone", phone);
  pushField("alamat", alamat);
  pushField("jenis_kelamin", jenis_kelamin);
  pushField("nama_wali", nama_wali);
  pushField("no_wali", no_wali);
  pushField("foto", fotoPath);

  if (fields.length === 0) {
    return res.status(400).json({ message: "Tidak ada data yang dikirim" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, [
      ...values,
      userId,
    ]);

    await conn.commit();

    const [[updated]] = await conn.query(
      `SELECT id, name, email, phone, foto, alamat, jenis_kelamin, nama_wali, no_wali
       FROM users WHERE id = ? LIMIT 1`,
      [userId],
    );

    return res.status(200).json({
      message: "Profile berhasil diperbarui",
      data: updated,
    });
  } catch (err) {
    await conn.rollback();
    return res
      .status(500)
      .json({ message: "Gagal update profile", error: err.message });
  } finally {
    conn.release();
  }
};
