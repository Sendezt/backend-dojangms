const db = require("../../../config/database");

exports.getAdminById = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const adminId = parseInt(req.params.id);

    if (!adminId || isNaN(adminId) || adminId < 1) {
      return res.status(400).json({ message: "ID admin tidak valid" });
    }

    const [[row]] = await conn.query(
      `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.foto,
        u.jenis_kelamin,
        u.alamat,
        u.tanggal_lahir,
        u.status,
        u.created_at,
        u.updated_at
      FROM users u
      WHERE u.id = ?
        AND EXISTS (
          SELECT 1 FROM user_roles ur
          JOIN roles r ON r.id = ur.role_id
          WHERE ur.user_id = u.id AND r.name = 'admin'
        )
      LIMIT 1
      `,
      [adminId],
    );

    if (!row) {
      return res.status(404).json({ message: "Admin tidak ditemukan" });
    }

    const data = {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      foto: row.foto,
      jenis_kelamin: row.jenis_kelamin,
      alamat: row.alamat,
      tanggal_lahir: row.tanggal_lahir,
      status: row.status,
      tanggal_bergabung: row.created_at,
      updated_at: row.updated_at,
    };

    return res.status(200).json({
      message: "Berhasil mengambil detail admin",
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal mengambil detail admin",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
