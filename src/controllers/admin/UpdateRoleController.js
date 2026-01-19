const db = require("../../config/database");

exports.updateUserRoles = async (req, res) => {
  const { id } = req.params;
  const { roles } = req.body;

  if (!Array.isArray(roles) || roles.length === 0) {
    return res.status(400).json({
      message: "Roles harus berupa array dan tidak boleh kosong",
    });
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // cek user
    const [[user]] = await conn.query("SELECT id FROM users WHERE id = ?", [
      id,
    ]);

    if (!user) {
      await conn.rollback();
      return res.status(404).json({
        message: "User tidak ditemukan",
      });
    }

    // hapus role lama
    await conn.query("DELETE FROM user_roles WHERE user_id = ?", [id]);

    // insert role baru
    for (const roleName of roles) {
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
        [id, role.id],
      );
    }

    await conn.commit();

    res.json({
      message: "Role user berhasil diperbarui",
      data: {
        user_id: id,
        roles,
      },
    });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({
      message: "Gagal memperbarui role user",
    });
  } finally {
    conn.release();
  }
};
