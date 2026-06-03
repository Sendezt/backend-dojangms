const db = require("../../config/database");
const bcrypt = require("bcrypt");

exports.updateUser = async (req, res) => {
  const conn = await db.getConnection(); // ← pakai connection untuk transaction

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
      sertifikasi,
    } = req.body;

    if (!id) {
      return res.status(400).json({ message: "ID user wajib diisi" });
    }

    // minimal 1 field dikirim
    if (
      name === undefined &&
      email === undefined &&
      phone === undefined &&
      password === undefined &&
      status === undefined &&
      tanggal_lahir === undefined &&
      belt_id === undefined &&
      spesialisasi === undefined &&
      sertifikasi === undefined
    ) {
      return res
        .status(400)
        .json({ message: "Minimal satu field harus diupdate" });
    }

    let isPelatih = false;
    if (spesialisasi !== undefined || sertifikasi !== undefined) {
      const [roleCheck] = await conn.execute(
        `SELECT r.name FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
         WHERE ur.user_id = ? AND r.name = 'pelatih'`,
        [id],
      );
      if (roleCheck.length === 0) {
        return res.status(400).json({
          message:
            "User ini bukan pelatih, tidak bisa update spesialisasi/sertifikasi",
        });
      }
      isPelatih = true;
    }

    // cek user
    const [rows] = await conn.execute("SELECT * FROM users WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }
    const current = rows[0];

    // validasi status
    if (status !== undefined && !["active", "inactive"].includes(status)) {
      return res.status(400).json({ message: "Status tidak valid" });
    }

    // validasi email unik
    if (email !== undefined && email !== current.email) {
      const [checkEmail] = await conn.execute(
        "SELECT id FROM users WHERE email = ? AND id != ?",
        [email, id],
      );
      if (checkEmail.length > 0) {
        return res.status(400).json({ message: "Email sudah digunakan" });
      }
    }

    // validasi belt_id — pastikan ada di tabel belts
    if (belt_id !== undefined) {
      const [checkBelt] = await conn.execute(
        "SELECT id FROM belts WHERE id = ?",
        [belt_id],
      );
      if (checkBelt.length === 0) {
        return res.status(400).json({ message: "Sabuk tidak ditemukan" });
      }
    }

    // validasi tanggal lahir
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

    // hash password jika diubah
    let hashedPassword = current.password;
    if (password !== undefined) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    if (
      spesialisasi !== undefined &&
      !["kyorugi", "poomsae", "kyorugi & poomsae"].includes(spesialisasi)
    ) {
      return res.status(400).json({ message: "Spesialisasi tidak valid" });
    }

    // ── mulai transaction ───────────────────────────────────────────────────
    await conn.beginTransaction();

    // update tabel users
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

    // update sabuk jika belt_id dikirim
    let newBelt = null;
    if (belt_id !== undefined) {
      // 1. non-aktifkan sabuk lama
      await conn.execute(
        "UPDATE user_belts SET is_current = 0 WHERE user_id = ?",
        [id],
      );

      // 2. cek apakah sabuk ini pernah dimiliki user sebelumnya
      const [existingBelt] = await conn.execute(
        "SELECT id FROM user_belts WHERE user_id = ? AND belt_id = ?",
        [id, belt_id],
      );

      if (existingBelt.length > 0) {
        // update record lama — aktifkan kembali
        await conn.execute(
          "UPDATE user_belts SET is_current = 1, achieved_at = ? WHERE user_id = ? AND belt_id = ?",
          [belt_achieved_at ?? new Date(), id, belt_id],
        );
      } else {
        // insert sabuk baru
        await conn.execute(
          "INSERT INTO user_belts (user_id, belt_id, achieved_at, is_current) VALUES (?, ?, ?, 1)",
          [id, belt_id, belt_achieved_at ?? new Date()],
        );
      }

      // ambil nama sabuk untuk response
      const [beltData] = await conn.execute(
        "SELECT id, name FROM belts WHERE id = ?",
        [belt_id],
      );
      newBelt = beltData[0];
    }

    // UPDATE spesialisasi & sertifikasi (jika dikirim dan user adalah pelatih)
    if (isPelatih) {
      // cek apakah sudah ada record di tabel pelatih
      const [existingPelatih] = await conn.execute(
        "SELECT id FROM pelatih WHERE user_id = ?",
        [id],
      );
      if (existingPelatih.length > 0) {
        // update existing
        const updates = [];
        const values = [];
        if (spesialisasi !== undefined) {
          updates.push("spesialisasi = ?");
          values.push(spesialisasi);
        }
        if (sertifikasi !== undefined) {
          updates.push("sertifikasi = ?");
          values.push(sertifikasi);
        }
        if (updates.length > 0) {
          values.push(id);
          await conn.execute(
            `UPDATE pelatih SET ${updates.join(", ")} WHERE user_id = ?`,
            values,
          );
        }
      } else {
        // insert new record
        await conn.execute(
          `INSERT INTO pelatih (user_id, spesialisasi, sertifikasi)
         VALUES (?, ?, ?)`,
          [id, spesialisasi ?? "kyorugi & poomsae", sertifikasi ?? null],
        );
      }
    }

    await conn.commit();
    // ── end transaction ─────────────────────────────────────────────────────
    let pelatihData = null;
    if (isPelatih) {
      const [pelatihRows] = await conn.execute(
        "SELECT spesialisasi, sertifikasi FROM pelatih WHERE user_id = ?",
        [id],
      );
      if (pelatihRows.length > 0) {
        pelatihData = pelatihRows[0];
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
          spesialisasi: pelatihData.spesialisasi,
          sertifikasi: pelatihData.sertifikasi,
        }),
      },
    });
  } catch (error) {
    await conn.rollback(); // ← batalkan semua jika ada yang gagal
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan pada server" });
  } finally {
    conn.release();
  }
};
