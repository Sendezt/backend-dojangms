const db = require("../../config/database");
const bcrypt = require("bcrypt");

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, password, status, tanggal_lahir } = req.body;

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
      status === undefined &&
      tanggal_lahir === undefined
    ) {
      return res.status(400).json({
        message: "Minimal satu field harus diupdate",
      });
    }

    // cek user
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

    // validasi email unik
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

    // validasi tanggal lahir
    let finalTanggalLahir = current.tanggal_lahir;
    let finalTahunLahir = current.tahun_lahir;

    if (tanggal_lahir !== undefined) {
      const parsedDate = new Date(tanggal_lahir);

      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          message: "Format tanggal lahir tidak valid",
        });
      }

      finalTanggalLahir = tanggal_lahir;
      finalTahunLahir = parsedDate.getFullYear();
    }

    // hash password jika diubah
    let hashedPassword = current.password;
    if (password !== undefined) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const updatedData = {
      name: name ?? current.name,
      email: email ?? current.email,
      phone: phone ?? current.phone,
      password: hashedPassword,
      tanggal_lahir: finalTanggalLahir,
      tahun_lahir: finalTahunLahir,
      status: status ?? current.status,
    };

    const query = `
      UPDATE users
      SET 
        name = ?,
        email = ?,
        phone = ?,
        password = ?,
        tanggal_lahir = ?,
        tahun_lahir = ?,
        status = ?
      WHERE id = ?
    `;

    await db.execute(query, [
      updatedData.name,
      updatedData.email,
      updatedData.phone,
      updatedData.password,
      updatedData.tanggal_lahir,
      updatedData.tahun_lahir,
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
        tanggal_lahir: updatedData.tanggal_lahir,
        tahun_lahir: updatedData.tahun_lahir,
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
