const db = require("../../config/database");
const bcrypt = require("bcrypt");

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, password, status } = req.body;

    if (!id) {
      return res.status(400).json({
        message: "ID user wajib diisi",
      });
    }

    // minimal 1 field dikirim
    if (
      name === undefined &&
      email === undefined &&
      phone === undefined &&
      password === undefined &&
      status === undefined
    ) {
      return res.status(400).json({
        message: "Minimal satu field harus diupdate",
      });
    }

    // cek user ada atau tidak
    const [rows] = await db.execute("SELECT * FROM users WHERE id = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        message: "User tidak ditemukan",
      });
    }

    const current = rows[0];

    // validasi status
    if (status !== undefined && !["active", "inactive"].includes(status)) {
      return res.status(400).json({
        message: "Status tidak valid",
      });
    }

    // validasi email unik (jika diubah)
    if (email !== undefined && email !== current.email) {
      const [checkEmail] = await db.execute(
        "SELECT id FROM users WHERE email = ? AND id != ?",
        [email, id],
      );

      if (checkEmail.length > 0) {
        return res.status(400).json({
          message: "Email sudah digunakan",
        });
      }
    }

    // hash password jika dikirim
    let hashedPassword = current.password;
    if (password !== undefined) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const updatedData = {
      name: name ?? current.name,
      email: email ?? current.email,
      phone: phone ?? current.phone,
      password: hashedPassword,
      status: status ?? current.status,
    };

    const query = `
      UPDATE users
      SET name = ?, email = ?, phone = ?, password = ?, status = ?
      WHERE id = ?
    `;

    await db.execute(query, [
      updatedData.name,
      updatedData.email,
      updatedData.phone,
      updatedData.password,
      updatedData.status,
      id,
    ]);

    res.status(200).json({
      message: "User berhasil diperbarui",
      data: {
        id,
        name: updatedData.name,
        email: updatedData.email,
        phone: updatedData.phone,
        status: updatedData.status,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Terjadi kesalahan pada server",
    });
  }
};
