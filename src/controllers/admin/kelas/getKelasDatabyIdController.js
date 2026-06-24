const db = require("../../../config/database");

exports.getKelasLengkapById = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const kelasId = parseInt(req.params.id);
    if (!kelasId || isNaN(kelasId) || kelasId < 1) {
      return res.status(400).json({ message: "ID kelas tidak valid" });
    }

    // 1. Detail kelas
    const [kelasRows] = await conn.query(
      "SELECT id, nama, deskripsi, status, created_at FROM kelas WHERE id = ?",
      [kelasId]
    );
    if (kelasRows.length === 0) {
      return res.status(404).json({ message: "Kelas tidak ditemukan" });
    }
    const kelas = kelasRows[0];

    // 2. Jadwal kelas (tipe = 'kelas')
    const [jadwalRows] = await conn.query(
      `SELECT 
         id, nama, hari, effective_from, effective_until,
         tanggal_mulai, tanggal_selesai, jam_mulai, jam_selesai,
         lokasi, keterangan, status
       FROM jadwal
       WHERE kelas_id = ? AND tipe = 'kelas'
       ORDER BY effective_from ASC, hari ASC`,
      [kelasId]
    );

    // 3. Pelatih aktif di kelas ini
    const [pelatihRows] = await conn.query(
      `SELECT 
         u.id, u.name, u.email, u.phone, u.foto, u.tanggal_lahir,
         p.spesialisasi, kp.tanggal_bergabung,
         b.id AS belt_id, b.name AS belt_name
       FROM kelas_pelatih kp
       JOIN users u ON kp.user_id = u.id
       LEFT JOIN pelatih p ON p.user_id = u.id
       LEFT JOIN user_belts ub ON ub.user_id = u.id AND ub.is_current = 1
       LEFT JOIN belts b ON b.id = ub.belt_id
       WHERE kp.kelas_id = ? AND kp.status = 'aktif' AND u.status = 'active'
       ORDER BY u.name ASC`,
      [kelasId]
    );

    // 4. Murid aktif di kelas ini
    const [muridRows] = await conn.query(
      `SELECT 
         u.id, u.name, u.email, u.phone, u.foto, u.tanggal_lahir,
         km.tanggal_bergabung,
         b.id AS belt_id, b.name AS belt_name
       FROM kelas_murid km
       JOIN users u ON km.user_id = u.id
       LEFT JOIN user_belts ub ON ub.user_id = u.id AND ub.is_current = 1
       LEFT JOIN belts b ON b.id = ub.belt_id
       WHERE km.kelas_id = ? AND km.status = 'aktif' AND u.status = 'active'
       ORDER BY u.name ASC`,
      [kelasId]
    );

    // Format response
    const data = {
      id: kelas.id,
      nama: kelas.nama,
      deskripsi: kelas.deskripsi,
      status: kelas.status,
      created_at: kelas.created_at,
      jadwal: jadwalRows.map(j => ({
        id: j.id,
        nama: j.nama,
        hari: j.hari,
        effective_from: j.effective_from,
        effective_until: j.effective_until,
        tanggal_mulai: j.tanggal_mulai,
        tanggal_selesai: j.tanggal_selesai,
        jam_mulai: j.jam_mulai,
        jam_selesai: j.jam_selesai,
        lokasi: j.lokasi,
        keterangan: j.keterangan,
        status: j.status
      })),
      pelatih: pelatihRows.map(p => ({
        id: p.id,
        nama: p.name,
        email: p.email,
        telepon: p.phone,
        foto: p.foto,
        tanggal_lahir: p.tanggal_lahir,
        spesialisasi: p.spesialisasi,
        tanggal_bergabung: p.tanggal_bergabung,
        sabuk_saat_ini: p.belt_id ? { id: p.belt_id, nama: p.belt_name } : null
      })),
      murid: muridRows.map(m => ({
        id: m.id,
        nama: m.name,
        email: m.email,
        telepon: m.phone,
        foto: m.foto,
        tanggal_lahir: m.tanggal_lahir,
        tanggal_bergabung: m.tanggal_bergabung,
        sabuk_saat_ini: m.belt_id ? { id: m.belt_id, nama: m.belt_name } : null
      }))
    };

    return res.status(200).json({
      message: "Berhasil mengambil detail kelas",
      data
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal mengambil detail kelas",
      error: error.message
    });
  } finally {
    conn.release();
  }
};