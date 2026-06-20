const db = require("../../../config/database");

exports.triggerUpdateStatus = async (req, res) => {
  try {
    const [result] = await db.query(
      `UPDATE ujian_sabuk 
       SET status = 'selesai' 
       WHERE status = 'terjadwal' 
         AND tanggal_selesai < CURDATE() 
         AND deleted_at IS NULL`,
    );
    return res.status(200).json({
      success: true,
      message: `${result.affectedRows} ujian berhasil diupdate menjadi selesai`,
      affected: result.affectedRows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Gagal update status ujian",
      error: error.message,
    });
  }
};
