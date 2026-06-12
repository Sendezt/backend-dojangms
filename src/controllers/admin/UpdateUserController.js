// src\controllers\admin\UpdateUserController.js
const db = require("../../config/database");
const bcrypt = require("bcrypt");

exports.updateUser = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      password,
      status,
      tanggal_lahir,
      belt_id,
      belt_achieved_at,
      spesialisasi,
      sertifikasi, // array of object [{ id, nama }]
      bio,
    } = req.body;

    if (!id) {
      return res.status(400).json({ message: "ID user wajib diisi" });
    }

    // Minimal satu field dikirim
    if (
      name === undefined &&
      email === undefined &&
      phone === undefined &&
      password === undefined &&
      status === undefined &&
      tanggal_lahir === undefined &&
      belt_id === undefined &&
      belt_achieved_at == undefined &&
      spesialisasi === undefined &&
      sertifikasi === undefined &&
      bio === undefined
    ) {
      return res
        .status(400)
        .json({ message: "Minimal satu field harus diupdate" });
    }

    // Cek apakah user adalah pelatih (jika update field khusus pelatih)
    let isPelatih = false;
    let pelatihRecord = null;
    if (
      spesialisasi !== undefined ||
      sertifikasi !== undefined ||
      bio !== undefined
    ) {
      const [roleCheck] = await conn.execute(
        `SELECT r.name FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
         WHERE ur.user_id = ? AND r.name = 'pelatih'`,
        [id],
      );
      if (roleCheck.length === 0) {
        return res.status(400).json({
          message:
            "User ini bukan pelatih, tidak bisa update spesialisasi/sertifikasi/bio",
        });
      }
      isPelatih = true;

      // ambil pelatih_id jika ada
      const [pelatihRows] = await conn.execute(
        "SELECT id FROM pelatih WHERE user_id = ?",
        [id],
      );
      if (pelatihRows.length > 0) {
        pelatihRecord = pelatihRows[0];
      }
    }

    // Cek user
    const [rows] = await conn.execute("SELECT * FROM users WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }
    const current = rows[0];

    // Validasi status
    if (status !== undefined && !["active", "inactive"].includes(status)) {
      return res.status(400).json({ message: "Status tidak valid" });
    }

    // Validasi email unik
    if (email !== undefined && email !== current.email) {
      const [checkEmail] = await conn.execute(
        "SELECT id FROM users WHERE email = ? AND id != ?",
        [email, id],
      );
      if (checkEmail.length > 0) {
        return res.status(400).json({ message: "Email sudah digunakan" });
      }
    }

    // Validasi belt_id
    if (belt_id !== undefined) {
      const [checkBelt] = await conn.execute(
        "SELECT id FROM belts WHERE id = ?",
        [belt_id],
      );
      if (checkBelt.length === 0) {
        return res.status(400).json({ message: "Sabuk tidak ditemukan" });
      }
    }

    // Validasi tanggal lahir
    let finalTanggalLahir = current.tanggal_lahir;
    let finalTahunLahir = current.tahun_lahir;
    if (tanggal_lahir !== undefined) {
      const parsedDate = new Date(tanggal_lahir);
      if (isNaN(parsedDate.getTime())) {
        return res
          .status(400)
          .json({ message: "Format tanggal lahir tidak valid" });
      }
      finalTanggalLahir = tanggal_lahir;
      finalTahunLahir = parsedDate.getFullYear();
    }

    // Hash password jika diubah
    let hashedPassword = current.password;
    if (password !== undefined) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Validasi spesialisasi
    if (
      spesialisasi !== undefined &&
      !["kyorugi", "poomsae", "keduanya", "all", "kyourigi & poomsae"].includes(
        spesialisasi,
      )
    ) {
      return res.status(400).json({ message: "Spesialisasi tidak valid" });
    }

    // Validasi sertifikasi: harus array of object dengan id dan nama
    if (sertifikasi !== undefined) {
      if (!Array.isArray(sertifikasi)) {
        return res
          .status(400)
          .json({ message: "sertifikasi harus berupa array" });
      }
      for (const item of sertifikasi) {
        if (!item.id || typeof item.id !== "number") {
          return res.status(400).json({
            message:
              "Setiap item sertifikasi harus memiliki properti 'id' (integer)",
          });
        }
        if (
          !item.nama ||
          typeof item.nama !== "string" ||
          item.nama.trim() === ""
        ) {
          return res.status(400).json({
            message:
              "Setiap item sertifikasi harus memiliki properti 'nama' (string tidak kosong)",
          });
        }
      }
    }

    // Mulai transaction
    await conn.beginTransaction();

    // Update tabel users
    await conn.execute(
      `UPDATE users SET 
        name = ?, email = ?, phone = ?, password = ?,
        tanggal_lahir = ?, tahun_lahir = ?, status = ?
       WHERE id = ?`,
      [
        name ?? current.name,
        email ?? current.email,
        phone ?? current.phone,
        hashedPassword,
        finalTanggalLahir,
        finalTahunLahir,
        status ?? current.status,
        id,
      ],
    );

    // Update sabuk jika belt_id dikirim
    let newBelt = null;
    if (belt_id !== undefined) {
      await conn.execute(
        "UPDATE user_belts SET is_current = 0 WHERE user_id = ?",
        [id],
      );
      const [existingBelt] = await conn.execute(
        "SELECT id FROM user_belts WHERE user_id = ? AND belt_id = ?",
        [id, belt_id],
      );
      if (existingBelt.length > 0) {
        await conn.execute(
          "UPDATE user_belts SET is_current = 1, achieved_at = ? WHERE user_id = ? AND belt_id = ?",
          [belt_achieved_at ?? new Date(), id, belt_id],
        );
      } else {
        await conn.execute(
          "INSERT INTO user_belts (user_id, belt_id, achieved_at, is_current) VALUES (?, ?, ?, 1)",
          [id, belt_id, belt_achieved_at ?? new Date()],
        );
      }
      const [beltData] = await conn.execute(
        "SELECT id, name FROM belts WHERE id = ?",
        [belt_id],
      );
      newBelt = beltData[0];
    }

    // Update data pelatih (spesialisasi, bio)
    if (isPelatih) {
      if (!pelatihRecord) {
        const insertResult = await conn.execute(
          `INSERT INTO pelatih (user_id, spesialisasi, bio)
           VALUES (?, ?, ?)`,
          [id, spesialisasi ?? "keduanya", bio ?? null],
        );
        pelatihRecord = { id: insertResult[0].insertId };
      } else {
        const updates = [];
        const values = [];
        if (spesialisasi !== undefined) {
          updates.push("spesialisasi = ?");
          values.push(spesialisasi);
        }
        if (bio !== undefined) {
          updates.push("bio = ?");
          values.push(bio);
        }
        if (updates.length > 0) {
          values.push(id);
          await conn.execute(
            `UPDATE pelatih SET ${updates.join(", ")} WHERE user_id = ?`,
            values,
          );
        }
      }

      // Update sertifikasi berdasarkan ID (TIDAK replace all)
      if (sertifikasi !== undefined) {
        for (const item of sertifikasi) {
          // Cek apakah sertifikasi dengan id ini milik pelatih yang sama
          const [check] = await conn.execute(
            "SELECT id FROM sertifikasi_pelatih WHERE id = ? AND pelatih_id = ?",
            [item.id, pelatihRecord.id],
          );
          if (check.length === 0) {
            // Rollback jika ada ID yang tidak valid
            throw new Error(
              `Sertifikasi dengan ID ${item.id} tidak ditemukan atau bukan milik pelatih ini`,
            );
          }
          // Update nama sertifikasi
          await conn.execute(
            "UPDATE sertifikasi_pelatih SET nama_sertifikasi = ? WHERE id = ?",
            [item.nama.trim(), item.id],
          );
        }
      }
    }

    await conn.commit();

    // Ambil data terbaru untuk response
    let pelatihData = null;
    if (isPelatih) {
      const [pelatihRows] = await conn.execute(
        "SELECT spesialisasi, bio FROM pelatih WHERE user_id = ?",
        [id],
      );
      if (pelatihRows.length > 0) {
        const [sertifRows] = await conn.execute(
          `SELECT sp.id, sp.nama_sertifikasi
           FROM sertifikasi_pelatih sp
           JOIN pelatih p ON p.id = sp.pelatih_id
           WHERE p.user_id = ?`,
          [id],
        );
        pelatihData = {
          spesialisasi: pelatihRows[0].spesialisasi,
          bio: pelatihRows[0].bio,
          sertifikasi: sertifRows.map((s) => ({
            id: s.id,
            nama: s.nama_sertifikasi,
          })),
        };
      }
    }

    res.status(200).json({
      message: "User berhasil diperbarui",
      data: {
        id,
        name: name ?? current.name,
        email: email ?? current.email,
        phone: phone ?? current.phone,
        tanggal_lahir: finalTanggalLahir,
        tahun_lahir: finalTahunLahir,
        status: status ?? current.status,
        ...(newBelt && {
          sabuk_saat_ini: { id: newBelt.id, name: newBelt.name },
        }),
        ...(pelatihData && {
          pelatih: pelatihData,
        }),
      },
    });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    res
      .status(500)
      .json({ message: "Terjadi kesalahan pada server", error: error.message });
  } finally {
    conn.release();
  }
};
