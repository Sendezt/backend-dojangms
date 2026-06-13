// src/controllers/admin/ujianSabuk/getUjianSabukByIdController.js
const db = require("../../../config/database");

exports.getUjianSabukById = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id < 1) {
      return res.status(400).json({ message: "ID ujian tidak valid" });
    }

    // Detail ujian
    const [ujianRows] = await conn.query(
      `SELECT id, tanggal_mulai, tanggal_selesai, level_ujian, lokasi, keterangan, status, created_at
       FROM ujian_sabuk WHERE id = ?`,
      [id]
    );
    if (ujianRows.length === 0) {
      return res.status(404).json({ message: "Ujian sabuk tidak ditemukan" });
    }
    const ujian = ujianRows[0];

    // Daftar peserta dengan struktur baru
    const [pesertaRows] = await conn.query(
      `SELECT 
         pu.id AS peserta_id,
         pu.user_id,
         pu.belt_asal_id,
         pu.belt_tujuan_id,
         pu.status AS peserta_status,
         pu.tanggal_lulus,
         pu.tanggal_edit,
         u.name AS murid_nama,
         u.email AS murid_email,
         u.phone AS murid_telepon,
         ba.name AS belt_asal_nama,
         bt.name AS belt_tujuan_nama
       FROM peserta_ujian pu
       JOIN users u ON pu.user_id = u.id
       JOIN belts ba ON pu.belt_asal_id = ba.id
       JOIN belts bt ON pu.belt_tujuan_id = bt.id
       WHERE pu.ujian_id = ?
       ORDER BY u.name ASC`,
      [id]
    );

    const peserta = pesertaRows.map(p => ({
      id: p.peserta_id,
      murid: {
        id: p.user_id,
        nama: p.murid_nama,
        email: p.murid_email,
        telepon: p.murid_telepon,
      },
      belt_asal: {
        id: p.belt_asal_id,
        nama: p.belt_asal_nama,
      },
      belt_tujuan: {
        id: p.belt_tujuan_id,
        nama: p.belt_tujuan_nama,
      },
      status: p.peserta_status,
      tanggal_lulus: p.tanggal_lulus,
      tanggal_edit: p.tanggal_edit,
    }));

    const response = {
      ...ujian,
      total_peserta: peserta.length,
      peserta,
    };

    return res.status(200).json({
      message: "Detail ujian sabuk berhasil diambil",
      data: response,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal mengambil detail ujian sabuk",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};