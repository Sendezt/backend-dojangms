const db = require("../../../config/database");

exports.addBulkWhatsappGroup = async (req, res) => {
  const { groups } = req.body; // array of { group_jid, nama_grup, kelas_id? }

  if (!groups || !Array.isArray(groups) || groups.length === 0) {
    return res.status(400).json({
      success: false,
      message: "groups harus berupa array tidak kosong",
    });
  }

  const conn = await db.getConnection();
  try {
    const success = [];
    const errors = [];

    for (const item of groups) {
      const { group_jid, nama_grup, kelas_id } = item;

      // Validasi wajib
      if (
        !group_jid ||
        typeof group_jid !== "string" ||
        group_jid.trim() === ""
      ) {
        errors.push({ item, error: "group_jid wajib diisi" });
        continue;
      }
      if (
        !nama_grup ||
        typeof nama_grup !== "string" ||
        nama_grup.trim() === ""
      ) {
        errors.push({ item, error: "nama_grup wajib diisi" });
        continue;
      }

      const finalGroupJid = group_jid.trim();
      const finalNama = nama_grup.trim();
      const finalKelasId = kelas_id ? parseInt(kelas_id) : null;

      // Validasi kelas_id jika diberikan
      if (finalKelasId !== null) {
        if (isNaN(finalKelasId) || finalKelasId < 1) {
          errors.push({ item, error: "kelas_id tidak valid" });
          continue;
        }
        // Cek apakah kelas ada
        const [kelas] = await conn.query("SELECT id FROM kelas WHERE id = ?", [
          finalKelasId,
        ]);
        if (kelas.length === 0) {
          errors.push({
            item,
            error: `Kelas dengan ID ${finalKelasId} tidak ditemukan`,
          });
          continue;
        }
        // Cek apakah kelas_id sudah digunakan di grup lain (karena UNIQUE)
        const [existingKelas] = await conn.query(
          "SELECT id FROM whatsapp_group WHERE kelas_id = ?",
          [finalKelasId],
        );
        if (existingKelas.length > 0) {
          errors.push({
            item,
            error: `Kelas ID ${finalKelasId} sudah terdaftar di grup lain`,
          });
          continue;
        }
      }

      // Cek duplikasi group_jid
      const [existingJid] = await conn.query(
        "SELECT id FROM whatsapp_group WHERE group_jid = ?",
        [finalGroupJid],
      );
      if (existingJid.length > 0) {
        errors.push({
          item,
          error: `Group JID ${finalGroupJid} sudah terdaftar`,
        });
        continue;
      }

      // Insert
      await conn.query(
        `INSERT INTO whatsapp_group (group_jid, nama_grup, kelas_id, status)
         VALUES (?, ?, ?, 'aktif')`,
        [finalGroupJid, finalNama, finalKelasId],
      );

      success.push({
        group_jid: finalGroupJid,
        nama_grup: finalNama,
        kelas_id: finalKelasId,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Proses bulk selesai",
      success_count: success.length,
      error_count: errors.length,
      success,
      errors,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal menambahkan grup WhatsApp",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
