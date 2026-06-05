const db = require("../../../config/database");

exports.updateKelas = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const kelasId = parseInt(req.params.id);
    const { nama, deskripsi, status } = req.body;

    // Validasi ID
    if (!kelasId || isNaN(kelasId) || kelasId < 1) {
      return res.status(400).json({ message: "ID kelas tidak valid" });
    }

    // Minimal satu field dikirim
    if (nama === undefined && deskripsi === undefined && status === undefined) {
      return res.status(400).json({ message: "Minimal satu field harus diupdate" });
    }

    // Cek apakah kelas ada
    const [kelasRows] = await conn.query(
      "SELECT id, nama, deskripsi, status FROM kelas WHERE id = ?",
      [kelasId]
    );
    if (kelasRows.length === 0) {
      return res.status(404).json({ message: "Kelas tidak ditemukan" });
    }

    // Validasi status jika dikirim
    if (status !== undefined && !["aktif", "nonaktif"].includes(status)) {
      return res.status(400).json({ message: "Status harus 'aktif' atau 'nonaktif'" });
    }

    // Validasi nama unik (jika nama diubah dan nama baru sudah ada)
    if (nama !== undefined && nama.trim() !== kelasRows[0].nama) {
      const [existing] = await conn.query(
        "SELECT id FROM kelas WHERE nama = ? AND id != ?",
        [nama.trim(), kelasId]
      );
      if (existing.length > 0) {
        return res.status(409).json({ message: "Nama kelas sudah digunakan oleh kelas lain" });
      }
    }

    // Bangun query UPDATE dinamis
    const updateFields = [];
    const updateValues = [];

    if (nama !== undefined) {
      updateFields.push("nama = ?");
      updateValues.push(nama.trim());
    }
    if (deskripsi !== undefined) {
      updateFields.push("deskripsi = ?");
      updateValues.push(deskripsi === "" ? null : deskripsi);
    }
    if (status !== undefined) {
      updateFields.push("status = ?");
      updateValues.push(status);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: "Tidak ada field valid untuk diupdate" });
    }

    // Eksekusi update
    updateValues.push(kelasId);
    const query = `UPDATE kelas SET ${updateFields.join(", ")} WHERE id = ?`;
    await conn.query(query, updateValues);

    // Ambil data terbaru setelah update
    const [updatedRows] = await conn.query(
      "SELECT id, nama, deskripsi, status FROM kelas WHERE id = ?",
      [kelasId]
    );

    return res.status(200).json({
      message: "Kelas berhasil diperbarui",
      data: updatedRows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal memperbarui kelas",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};