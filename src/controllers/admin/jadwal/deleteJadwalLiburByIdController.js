const db = require("../../../config/database");

exports.deleteLiburJadwalById = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const liburJadwalId = parseInt(req.params.id);

    if (isNaN(liburJadwalId) || liburJadwalId < 1) {
      return res.status(400).json({
        message: "ID libur jadwal tidak valid",
      });
    }

    const [existing] = await conn.query(
      `
      SELECT id
      FROM libur_jadwal
      WHERE id = ?
      LIMIT 1
      `,
      [liburJadwalId],
    );

    if (existing.length === 0) {
      return res.status(404).json({
        message: "Data libur jadwal tidak ditemukan",
      });
    }

    await conn.query(
      `
      DELETE FROM libur_jadwal
      WHERE id = ?
      `,
      [liburJadwalId],
    );

    return res.status(200).json({
      message: "Libur jadwal berhasil dihapus",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Gagal menghapus libur jadwal",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
