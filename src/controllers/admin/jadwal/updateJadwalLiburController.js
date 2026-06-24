const db = require("../../../config/database");

exports.updateLiburJadwal = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id < 1) {
      return res.status(400).json({ message: "ID libur tidak valid" });
    }

    const { tanggal, keterangan } = req.body;
    if (tanggal === undefined && keterangan === undefined) {
      return res
        .status(400)
        .json({
          message: "Minimal satu field (tanggal/keterangan) harus diupdate",
        });
    }

    // Ambil data existing
    const [existing] = await conn.query(
      "SELECT * FROM libur_jadwal WHERE id = ?",
      [id],
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: "Data libur tidak ditemukan" });
    }
    const current = existing[0];
    const jadwalId = current.jadwal_id;

    let finalTanggal = current.tanggal;
    let finalKeterangan = current.keterangan;

    // Validasi tanggal jika diubah
    if (tanggal !== undefined) {
      const parsedDate = new Date(tanggal);
      if (isNaN(parsedDate.getTime())) {
        return res
          .status(400)
          .json({ message: "Format tanggal tidak valid (YYYY-MM-DD)" });
      }
      finalTanggal = tanggal;
      // Cek duplikasi: untuk jadwal yang sama, tidak boleh ada libur lain dengan tanggal yang sama (kecuali dirinya sendiri)
      const [duplicate] = await conn.query(
        "SELECT id FROM libur_jadwal WHERE jadwal_id = ? AND tanggal = ? AND id != ?",
        [jadwalId, finalTanggal, id],
      );
      if (duplicate.length > 0) {
        return res
          .status(409)
          .json({ message: "Tanggal libur sudah ada untuk jadwal ini" });
      }
    }

    if (keterangan !== undefined) {
      finalKeterangan =
        keterangan && keterangan.trim() !== "" ? keterangan.trim() : null;
    }

    // Update
    await conn.query(
      "UPDATE libur_jadwal SET tanggal = ?, keterangan = ? WHERE id = ?",
      [finalTanggal, finalKeterangan, id],
    );

    // Ambil data terbaru untuk response (sertakan nama jadwal)
    const [updated] = await conn.query(
      `SELECT lj.id, lj.jadwal_id, lj.tanggal, lj.keterangan, lj.created_at,
              j.nama AS jadwal_nama
       FROM libur_jadwal lj
       JOIN jadwal j ON lj.jadwal_id = j.id
       WHERE lj.id = ?`,
      [id],
    );

    return res.status(200).json({
      message: "Data libur berhasil diperbarui",
      data: updated[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal memperbarui data libur",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
