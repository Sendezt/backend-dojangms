const db = require("../../../config/database");

exports.updatePengumuman = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id < 1) {
      return res.status(400).json({ message: "ID pengumuman tidak valid" });
    }

    // Ambil data pengumuman saat ini
    const [rows] = await conn.query(
      "SELECT id, status, target_type FROM pengumuman WHERE id = ?",
      [id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Pengumuman tidak ditemukan" });
    }
    const current = rows[0];

    // ===== ATURAN: Tidak boleh edit jika sudah terkirim =====
    if (current.status === "terkirim") {
      return res.status(403).json({
        message: "Pengumuman yang sudah terkirim tidak dapat diedit",
      });
    }

    // Ambil field yang akan diupdate
    const {
      judul,
      isi,
      target_type,
      target_role,
      kelas_id,
      user_ids,
      status,
      scheduled_at,
      kirim_whatsapp,
      whatsapp_scope,
    } = req.body;

    // Validasi minimal ada field yang diupdate
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Tidak ada field yang diupdate" });
    }

    let updateFields = [];
    let values = [];

    // Fungsi helper validasi target
    const validateTarget = (type) => {
      if (type === "role" && !target_role) {
        throw new Error("target_role wajib untuk target_type = role");
      }
      if (type === "kelas" && (!kelas_id || isNaN(kelas_id))) {
        throw new Error("kelas_id wajib untuk target_type = kelas");
      }
      if (
        type === "individu" &&
        (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0)
      ) {
        throw new Error("user_ids wajib untuk target_type = individu");
      }
    };

    // Validasi target_type jika diubah
    let finalTargetType = current.target_type;
    if (target_type !== undefined) {
      if (!["global", "role", "kelas", "individu"].includes(target_type)) {
        return res.status(400).json({ message: "target_type tidak valid" });
      }
      try {
        validateTarget(target_type);
      } catch (err) {
        return res.status(400).json({ message: err.message });
      }
      finalTargetType = target_type;
      updateFields.push("target_type = ?");
      values.push(target_type);
    }

    // Judul
    if (judul !== undefined) {
      if (!judul.trim())
        return res.status(400).json({ message: "Judul tidak boleh kosong" });
      updateFields.push("judul = ?");
      values.push(judul.trim());
    }

    // Isi
    if (isi !== undefined) {
      if (!isi.trim())
        return res.status(400).json({ message: "Isi tidak boleh kosong" });
      updateFields.push("isi = ?");
      values.push(isi.trim());
    }

    // Target role
    if (target_role !== undefined) {
      if (
        finalTargetType === "role" &&
        !["semua", "murid", "pelatih"].includes(target_role)
      ) {
        return res.status(400).json({ message: "target_role tidak valid" });
      }
      updateFields.push("target_role = ?");
      values.push(target_role || null);
    }

    // Kelas ID
    if (kelas_id !== undefined) {
      if (finalTargetType === "kelas" && (isNaN(kelas_id) || kelas_id < 1)) {
        return res.status(400).json({ message: "kelas_id tidak valid" });
      }
      // Cek apakah kelas ada jika diisi
      if (kelas_id) {
        const [kelas] = await conn.query("SELECT id FROM kelas WHERE id = ?", [
          kelas_id,
        ]);
        if (kelas.length === 0) {
          return res.status(404).json({ message: "Kelas tidak ditemukan" });
        }
      }
      updateFields.push("kelas_id = ?");
      values.push(kelas_id || null);
    }

    // Kirim WhatsApp
    if (kirim_whatsapp !== undefined) {
      updateFields.push("kirim_whatsapp = ?");
      values.push(kirim_whatsapp ? 1 : 0);
    }

    // WhatsApp scope
    if (whatsapp_scope !== undefined) {
      if (!["grup_besar_saja", "semua_grup"].includes(whatsapp_scope)) {
        return res.status(400).json({ message: "whatsapp_scope tidak valid" });
      }
      updateFields.push("whatsapp_scope = ?");
      values.push(whatsapp_scope || null);
    }

    // Status & scheduled_at
    let finalStatus = current.status;
    if (status !== undefined) {
      if (!["draft", "terjadwal", "terkirim"].includes(status)) {
        return res.status(400).json({ message: "Status tidak valid" });
      }
      // Jika status diubah menjadi terjadwal
      if (status === "terjadwal") {
        if (!scheduled_at || isNaN(Date.parse(scheduled_at))) {
          return res
            .status(400)
            .json({ message: "scheduled_at wajib untuk status terjadwal" });
        }
        if (new Date(scheduled_at) <= new Date()) {
          return res
            .status(400)
            .json({
              message: "scheduled_at harus lebih besar dari waktu sekarang",
            });
        }
        updateFields.push("scheduled_at = ?");
        values.push(scheduled_at);
      } else {
        // Jika status bukan terjadwal, hapus scheduled_at
        updateFields.push("scheduled_at = ?");
        values.push(null);
        // Jika status diubah menjadi draft, tidak perlu scheduled_at
      }
      // Jika status diubah menjadi terkirim (langsung), tolak karena harus via endpoint kirim
      if (status === "terkirim") {
        return res.status(400).json({
          message: "Untuk mengirim pengumuman, gunakan endpoint /kirim",
        });
      }
      finalStatus = status;
      updateFields.push("status = ?");
      values.push(status);
    } else {
      // Jika status tidak berubah, tapi scheduled_at diubah (misal ubah waktu jadwal)
      if (scheduled_at !== undefined) {
        if (current.status !== "terjadwal") {
          return res.status(400).json({
            message: "scheduled_at hanya dapat diubah untuk status terjadwal",
          });
        }
        if (isNaN(Date.parse(scheduled_at))) {
          return res
            .status(400)
            .json({ message: "scheduled_at format tidak valid" });
        }
        if (new Date(scheduled_at) <= new Date()) {
          return res
            .status(400)
            .json({
              message: "scheduled_at harus lebih besar dari waktu sekarang",
            });
        }
        updateFields.push("scheduled_at = ?");
        values.push(scheduled_at);
      }
    }

    // Jika target_type diubah menjadi individu, user_ids harus ada
    if (finalTargetType === "individu") {
      if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
        return res
          .status(400)
          .json({ message: "user_ids wajib untuk target individu" });
      }
      const placeholders = user_ids.map(() => "?").join(",");
      const [users] = await conn.query(
        `SELECT id FROM users WHERE id IN (${placeholders})`,
        user_ids,
      );
      if (users.length !== user_ids.length) {
        return res
          .status(400)
          .json({ message: "Beberapa user_id tidak valid" });
      }
    }

    // Jika ada perubahan target_type ke individu, atau target_type sudah individu
    // kita akan update pengumuman_target_user di transaction

    // Mulai transaction
    await conn.beginTransaction();

    if (updateFields.length > 0) {
      values.push(id);
      await conn.query(
        `UPDATE pengumuman SET ${updateFields.join(", ")} WHERE id = ?`,
        values,
      );
    }

    // Update target user jika target_type = individu
    if (finalTargetType === "individu") {
      // Hapus yang lama
      await conn.query(
        "DELETE FROM pengumuman_target_user WHERE pengumuman_id = ?",
        [id],
      );
      // Insert yang baru
      if (user_ids && user_ids.length > 0) {
        const insertValues = user_ids.map((uid) => `(${id}, ${uid})`).join(",");
        await conn.query(
          `INSERT INTO pengumuman_target_user (pengumuman_id, user_id) VALUES ${insertValues}`,
        );
      }
    } else {
      // Jika bukan individu, hapus semua target user (jika ada sebelumnya)
      await conn.query(
        "DELETE FROM pengumuman_target_user WHERE pengumuman_id = ?",
        [id],
      );
    }

    await conn.commit();

    // Ambil data terbaru
    const [updated] = await conn.query(
      "SELECT * FROM pengumuman WHERE id = ?",
      [id],
    );

    return res.status(200).json({
      success: true,
      message: "Pengumuman berhasil diperbarui",
      data: updated[0],
    });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal memperbarui pengumuman",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
