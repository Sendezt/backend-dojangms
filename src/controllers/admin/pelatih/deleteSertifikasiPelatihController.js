const db = require("../../../config/database");

/**
 * DELETE /api/admin/pelatih/:pelatihId/sertifikasi/:sertifikasiId
 */
exports.deleteSertifikasiPelatih = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const pelatihId = parseInt(req.params.pelatihId);
    const sertifikasiId = parseInt(req.params.sertifikasiId);

    if (!pelatihId || isNaN(pelatihId) || pelatihId < 1) {
      return res.status(400).json({ message: "ID pelatih tidak valid" });
    }
    if (!sertifikasiId || isNaN(sertifikasiId) || sertifikasiId < 1) {
      return res.status(400).json({ message: "ID sertifikasi tidak valid" });
    }

    // cek apakah pelatih ada
    const [pelatihRecord] = await conn.query(
      `SELECT p.id
       FROM pelatih p
       JOIN users u ON u.id = p.user_id
       WHERE u.id = ?`,
      [pelatihId],
    );

    if (pelatihRecord.length === 0) {
      return res.status(404).json({ message: "Pelatih tidak ditemukan" });
    }

    const pelatihTableId = pelatihRecord[0].id;

    // cek apakah sertifikasi milik pelatih ini
    const [sertifRecord] = await conn.query(
      `SELECT id FROM sertifikasi_pelatih
       WHERE id = ? AND pelatih_id = ?`,
      [sertifikasiId, pelatihTableId],
    );

    if (sertifRecord.length === 0) {
      return res.status(404).json({
        message: "Sertifikasi tidak ditemukan atau bukan milik pelatih ini",
      });
    }

    // hapus
    await conn.query(`DELETE FROM sertifikasi_pelatih WHERE id = ?`, [
      sertifikasiId,
    ]);

    return res.status(200).json({
      message: "Sertifikasi berhasil dihapus",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal menghapus sertifikasi",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
