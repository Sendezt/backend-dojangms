const db = require("../config/database");

exports.authorizeRole = (...allowedRoles) => {
  return async (req, res, next) => {
    const conn = await db.getConnection();

    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      const userId = req.user.id;

      // Ambil role user
      const [rows] = await conn.query(
        `
        SELECT r.name
        FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = ?
        `,
        [userId],
      );

      if (rows.length === 0) {
        return res.status(403).json({
          message: "User tidak memiliki role",
        });
      }

      const userRoles = rows.map((r) => r.name);

      // cek apakah salah satu role user termasuk allowedRoles
      const isAllowed = userRoles.some((role) => allowedRoles.includes(role));

      if (!isAllowed) {
        return res.status(403).json({
          message: "Akses ditolak",
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        message: "Terjadi kesalahan saat validasi role",
      });
    } finally {
      conn.release();
    }
  };
};
