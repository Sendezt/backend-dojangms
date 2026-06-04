const db = require("../../../config/database");

exports.softDeleteAdmin = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const adminId = parseInt(req.params.id);

    if (!adminId || isNaN(adminId) || adminId < 1) {
      return res.status(400).json({ message: "ID admin tidak valid" });
    }

    // Cek apakah user dengan ID tersebut adalah admin
    const [[admin]] = await conn.query(
      `
      SELECT u.id, u.status
      FROM users u
      WHERE u.id = ?
        AND EXISTS (
          SELECT 1 FROM user_roles ur
          JOIN roles r ON r.id = ur.role_id
          WHERE ur.user_id = u.id AND r.name = 'admin'
        )
      `,
      [adminId],
    );

    if (!admin) {
      return res.status(404).json({ message: "Admin tidak ditemukan" });
    }

    if (admin.status === "inactive") {
      return res
        .status(400)
        .json({ message: "Admin sudah dalam status inactive" });
    }

    // Lakukan soft delete dengan mengubah status menjadi 'inactive'
    await conn.execute(
      `UPDATE users SET status = 'inactive', updated_at = NOW() WHERE id = ?`,
      [adminId],
    );

    // Ambil data terbaru untuk response
    const [[updatedAdmin]] = await conn.query(
      `SELECT id, name, email, status FROM users WHERE id = ?`,
      [adminId],
    );

    return res.status(200).json({
      message: "Admin berhasil di-nonaktifkan (soft delete)",
      data: {
        id: updatedAdmin.id,
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        status: updatedAdmin.status,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal menonaktifkan admin",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
