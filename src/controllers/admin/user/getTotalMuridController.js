const db = require("../../../config/database");

exports.getTotalMurid = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const [rows] = await conn.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.tanggal_lahir,
        u.status,
        u.created_at,
        roles.roles,
        belt.current_belt,
        belt.belt_achieved_at
      FROM users u
      LEFT JOIN (
        SELECT 
          ur.user_id,
          GROUP_CONCAT(r.name ORDER BY r.name SEPARATOR ', ') AS roles
        FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        GROUP BY ur.user_id
      ) roles ON roles.user_id = u.id
      LEFT JOIN (
        SELECT 
          ub.user_id,
          b.name AS current_belt,
          ub.achieved_at AS belt_achieved_at
        FROM user_belts ub
        JOIN belts b ON b.id = ub.belt_id
        WHERE ub.is_current = true
      ) belt ON belt.user_id = u.id
      ORDER BY u.created_at DESC
    `);

    if (rows.length === 0) {
      return res.status(200).json({
        message: "Data user masih kosong",
        total: 0,
        totalMuridAktif: 0,
        muridBaruBulanIni: 0,
      });
    }

    // Hitung semua murid aktif
    const totalMuridAktif = rows.filter((user) => {
      const roles = user.roles ? user.roles.split(", ") : [];
      const isMurid = roles.includes("murid");

      return isMurid && user.status === "active";
    }).length;

    // Hitung murid yang mendaftar bulan ini
    const now = new Date();
    const muridBaruBulanIni = rows.filter((user) => {
      const roles = user.roles ? user.roles.split(", ") : [];
      const isMurid = roles.includes("murid");
      const created = new Date(user.created_at);

      return (
        isMurid &&
        user.status === "active" &&
        created.getFullYear() === now.getFullYear() &&
        created.getMonth() === now.getMonth()
      );
    }).length;

    res.status(200).json({
      message: "Berhasil mengambil data user",
      total: rows.length,
      totalMuridAktif: totalMuridAktif,
      muridBaruBulanIni: muridBaruBulanIni,
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil data user",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
