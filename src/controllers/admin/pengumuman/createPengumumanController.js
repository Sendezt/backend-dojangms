// src/controllers/admin/pengumuman/createPengumumanController.js
const db = require("../../../config/database");
const { sendAnnouncement } = require("../../../helpers/announcementHelper");

exports.createPengumuman = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const {
      judul,
      isi,
      target_type,
      target_role,
      kelas_id,
      user_ids,
      status = "draft",
      scheduled_at,
      kirim_whatsapp = false,
      whatsapp_scope, // 'grup_besar_saja' atau 'semua_grup'
    } = req.body;

    // ===== Validasi =====
    if (!judul || !judul.trim()) {
      return res.status(400).json({ message: "Judul tidak boleh kosong" });
    }
    if (!isi || !isi.trim()) {
      return res.status(400).json({ message: "Isi tidak boleh kosong" });
    }
    if (
      !target_type ||
      !["global", "role", "kelas", "individu"].includes(target_type)
    ) {
      return res.status(400).json({ message: "target_type tidak valid" });
    }
    if (!["draft", "terjadwal", "terkirim"].includes(status)) {
      return res.status(400).json({ message: "Status tidak valid" });
    }

    // Validasi target_type
    if (target_type === "role") {
      if (
        !target_role ||
        !["semua", "murid", "pelatih"].includes(target_role)
      ) {
        return res
          .status(400)
          .json({ message: "target_role wajib untuk target_type = role" });
      }
    } else if (target_type === "kelas") {
      if (!kelas_id || isNaN(kelas_id) || kelas_id < 1) {
        return res
          .status(400)
          .json({ message: "kelas_id wajib untuk target_type = kelas" });
      }
      const [kelas] = await conn.query("SELECT id FROM kelas WHERE id = ?", [
        kelas_id,
      ]);
      if (kelas.length === 0) {
        return res.status(404).json({ message: "Kelas tidak ditemukan" });
      }
    } else if (target_type === "individu") {
      if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
        return res
          .status(400)
          .json({ message: "user_ids wajib untuk target_type = individu" });
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

    // Jika status = terjadwal, wajib ada scheduled_at
    if (status === "terjadwal") {
      if (!scheduled_at || isNaN(Date.parse(scheduled_at))) {
        return res
          .status(400)
          .json({ message: "scheduled_at wajib untuk status terjadwal" });
      }
      if (new Date(scheduled_at) <= new Date()) {
        return res.status(400).json({
          message: "scheduled_at harus lebih besar dari waktu sekarang",
        });
      }
    }

    // Di dalam createPengumuman, setelah validasi kirim_whatsapp
    if (kirim_whatsapp && target_type === "global") {
      // Jika whatsapp_group_id diberikan, kirim ke satu grup
      if (req.body.whatsapp_group_id) {
        const groupId = parseInt(req.body.whatsapp_group_id);
        if (isNaN(groupId) || groupId < 1) {
          return res
            .status(400)
            .json({ message: "whatsapp_group_id tidak valid" });
        }
        const [group] = await conn.query(
          "SELECT id FROM whatsapp_group WHERE id = ? AND status = 'aktif'",
          [groupId],
        );
        if (group.length === 0) {
          return res.status(404).json({
            message: "Grup WhatsApp tidak ditemukan atau tidak aktif",
          });
        }
        // Simpan group_id untuk digunakan di helper
        req.body._whatsapp_group_id = groupId;
      } else if (!whatsapp_scope) {
        return res.status(400).json({
          message: "whatsapp_scope wajib jika tidak mengirim ke satu grup",
        });
      }
    }

    // ===== Mulai transaction =====
    await conn.beginTransaction();

    // Insert pengumuman
    const [result] = await conn.query(
      `INSERT INTO pengumuman 
   (judul, isi, target_type, target_role, kelas_id, status, scheduled_at, kirim_whatsapp, whatsapp_scope, dibuat_oleh)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        judul.trim(),
        isi.trim(),
        target_type,
        target_role || null,
        kelas_id || null,
        status,
        scheduled_at || null,
        kirim_whatsapp ? 1 : 0,
        whatsapp_scope || null,
        req.user.id,
      ],
    );
    const pengumumanId = result.insertId;

    // Jika target_type = individu, simpan target user
    if (target_type === "individu" && user_ids && user_ids.length > 0) {
      const insertValues = user_ids
        .map((uid) => `(${pengumumanId}, ${uid})`)
        .join(",");
      await conn.query(
        `INSERT INTO pengumuman_target_user (pengumuman_id, user_id) VALUES ${insertValues}`,
      );
    }

    // ===== Logika berdasarkan status =====
    if (status === "draft") {
      // Hanya simpan, tidak ada proses kirim
      await conn.commit();
      return res.status(201).json({
        message: "Pengumuman berhasil disimpan sebagai draft",
        data: {
          id: pengumumanId,
          judul,
          isi,
          target_type,
          status: "draft",
        },
      });
    }

    if (status === "terjadwal") {
      // Simpan, nanti akan diproses oleh scheduler
      await conn.commit();
      return res.status(201).json({
        message:
          "Pengumuman dijadwalkan, akan dikirim pada waktu yang ditentukan",
        data: {
          id: pengumumanId,
          judul,
          isi,
          target_type,
          status: "terjadwal",
          scheduled_at,
        },
      });
    }

    if (status === "terkirim") {
      await sendAnnouncement(conn, {
        id: pengumumanId,
        judul,
        isi,
        target_type,
        target_role,
        kelas_id,
        kirim_whatsapp,
        whatsapp_scope: req.body._whatsapp_group_id ? null : whatsapp_scope,
        whatsapp_group_id: req.body._whatsapp_group_id || null,
      });
      await conn.commit();
      return res.status(201).json({
        message: "Pengumuman berhasil dibuat dan dikirim",
        data: {
          id: pengumumanId,
          status: "terkirim",
        },
      });
    }
  } catch (error) {
    await conn.rollback();
    console.error(error);
    return res.status(500).json({
      message: "Gagal membuat pengumuman",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
