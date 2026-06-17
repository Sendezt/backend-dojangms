const db = require("../../../config/database");

exports.updateWhatsappGroup = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id < 1) {
      return res.status(400).json({ message: "ID grup tidak valid" });
    }

    // Cek apakah grup ada
    const [existing] = await conn.query(
      "SELECT id, kelas_id, group_jid FROM whatsapp_group WHERE id = ?",
      [id],
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: "Grup WhatsApp tidak ditemukan" });
    }
    const current = existing[0];

    const { nama_grup, group_jid, kelas_id, status } = req.body;

    // Validasi minimal ada field yang diupdate
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Tidak ada field yang diupdate" });
    }

    let updateFields = [];
    let values = [];

    // Nama grup
    if (nama_grup !== undefined) {
      if (!nama_grup.trim()) {
        return res
          .status(400)
          .json({ message: "Nama grup tidak boleh kosong" });
      }
      updateFields.push("nama_grup = ?");
      values.push(nama_grup.trim());
    }

    // Group JID
    if (group_jid !== undefined) {
      if (!group_jid.trim()) {
        return res
          .status(400)
          .json({ message: "Group JID tidak boleh kosong" });
      }
      // Cek duplikasi JID (kecuali dirinya sendiri)
      const [duplicate] = await conn.query(
        "SELECT id FROM whatsapp_group WHERE group_jid = ? AND id != ?",
        [group_jid.trim(), id],
      );
      if (duplicate.length > 0) {
        return res
          .status(409)
          .json({ message: "Group JID sudah digunakan oleh grup lain" });
      }
      updateFields.push("group_jid = ?");
      values.push(group_jid.trim());
    }

    // Kelas ID
    // Kelas ID
    if (kelas_id !== undefined) {
      let finalKelasId = null;
      // Tangani kasus null atau string kosong -> set null
      if (kelas_id === "" || kelas_id === null) {
        finalKelasId = null;
      } else {
        // Parsing dan validasi angka
        const parsed = parseInt(kelas_id);
        if (isNaN(parsed) || parsed < 1) {
          return res.status(400).json({ message: "kelas_id tidak valid" });
        }
        finalKelasId = parsed;
      }

      // Jika finalKelasId tidak null, cek keberadaan kelas dan duplikasi
      if (finalKelasId !== null) {
        const [kelas] = await conn.query("SELECT id FROM kelas WHERE id = ?", [
          finalKelasId,
        ]);
        if (kelas.length === 0) {
          return res.status(404).json({ message: "Kelas tidak ditemukan" });
        }
        // Cek apakah kelas_id sudah digunakan oleh grup lain (kecuali dirinya sendiri)
        const [used] = await conn.query(
          "SELECT id FROM whatsapp_group WHERE kelas_id = ? AND id != ?",
          [finalKelasId, id],
        );
        if (used.length > 0) {
          return res
            .status(409)
            .json({
              message: "Kelas ini sudah terhubung dengan grup WhatsApp lain",
            });
        }
      }

      updateFields.push("kelas_id = ?");
      values.push(finalKelasId);
    }

    // Status
    if (status !== undefined) {
      if (!["aktif", "nonaktif"].includes(status)) {
        return res
          .status(400)
          .json({ message: "Status harus 'aktif' atau 'nonaktif'" });
      }
      updateFields.push("status = ?");
      values.push(status);
    }

    // Jika tidak ada field yang valid setelah semua validasi
    if (updateFields.length === 0) {
      return res
        .status(400)
        .json({ message: "Tidak ada field yang valid untuk diupdate" });
    }

    values.push(id);
    await conn.query(
      `UPDATE whatsapp_group SET ${updateFields.join(", ")} WHERE id = ?`,
      values,
    );

    // Ambil data terbaru
    const [updated] = await conn.query(
      `SELECT wg.id, wg.nama_grup, wg.group_jid, wg.kelas_id, k.nama AS kelas_nama, wg.status, wg.created_at
       FROM whatsapp_group wg
       LEFT JOIN kelas k ON wg.kelas_id = k.id
       WHERE wg.id = ?`,
      [id],
    );

    return res.status(200).json({
      success: true,
      message: "Grup WhatsApp berhasil diperbarui",
      data: updated[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal memperbarui grup WhatsApp",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
