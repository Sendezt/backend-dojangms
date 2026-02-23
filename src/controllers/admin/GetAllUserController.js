// src\controllers\admin\GetAllUserController.js
const db = require("../../config/database");

const fillMissingDates = (rawData, totalDays) => {
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
  );

  const map = {};
  rawData.forEach((row) => {
    const key = row.period.toISOString().slice(0, 10);
    map[key] = {
      muridAktif: row.muridAktif,
      totalMurid: row.totalMurid,
    };
  });

  const result = [];
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);

    const label = d.toISOString().slice(0, 10);

    result.push({
      period: label,
      muridAktif: map[label]?.muridAktif || 0,
      totalMurid: map[label]?.totalMurid || 0,
    });
  }

  return result;
};

exports.getAllUsers = async (req, res) => {
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

// ===== ENDPOINT UNTUK CHART DATA =====

exports.getChartData = async (req, res) => {
  const conn = await db.getConnection();
  const { range } = req.query;

  try {
    let intervalDays = 0;

    if (range === "7days") intervalDays = 7;
    else if (range === "1month") intervalDays = 30;
    else if (range === "3months") intervalDays = 90;
    else {
      return res.status(400).json({
        message: "Range tidak valid. Gunakan: 7days, 1month, atau 3months",
      });
    }

    // 🔥 Query tetap pakai struktur Anda
    const [chartData] = await conn.query(
      `
      SELECT 
        DATE(CONVERT_TZ(u.created_at, '+00:00', '+07:00')) AS period,
        COUNT(CASE WHEN ur.role_id = (SELECT id FROM roles WHERE name = 'murid') AND u.status = 'active' THEN 1 END) AS muridAktif,
        COUNT(CASE WHEN ur.role_id = (SELECT id FROM roles WHERE name = 'murid') THEN 1 END) AS totalMurid
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE CONVERT_TZ(u.created_at, '+00:00', '+07:00') 
            >= DATE_SUB(CONVERT_TZ(NOW(), '+00:00', '+07:00'), INTERVAL ? DAY)
      GROUP BY DATE(CONVERT_TZ(u.created_at, '+00:00', '+07:00'))
      ORDER BY period ASC
    `,
      [intervalDays],
    );

    // 🔥 Ambil waktu sekarang dalam WIB
    const now = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
    );

    // 🔥 Map hasil query
    const resultMap = {};
    chartData.forEach((row) => {
      const dateKey = row.period.toISOString().slice(0, 10);
      resultMap[dateKey] = {
        muridAktif: row.muridAktif,
        totalMurid: row.totalMurid,
      };
    });

    // 🔥 Generate tanggal lengkap sesuai interval
    const finalData = [];

    for (let i = intervalDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);

      const label = d.toISOString().slice(0, 10);

      finalData.push({
        period: label,
        muridAktif: resultMap[label]?.muridAktif || 0,
        totalMurid: resultMap[label]?.totalMurid || 0,
      });
    }

    res.status(200).json({
      message: "Berhasil mengambil data chart user",
      range: range,
      data: finalData,
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil data chart user",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};

// Alternatif: Endpoint untuk semua range sekaligus
exports.getChartDataAll = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const baseQuery = `
      SELECT 
        DATE(CONVERT_TZ(u.created_at, '+00:00', '+07:00')) AS period,
        COUNT(CASE WHEN ur.role_id = (SELECT id FROM roles WHERE name = 'murid') AND u.status = 'active' THEN 1 END) AS muridAktif,
        COUNT(CASE WHEN ur.role_id = (SELECT id FROM roles WHERE name = 'murid') THEN 1 END) AS totalMurid
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
    `;

    const [data7days] = await conn.query(`
      ${baseQuery}
      WHERE CONVERT_TZ(u.created_at, '+00:00', '+07:00') 
      >= DATE_SUB(CONVERT_TZ(NOW(), '+00:00', '+07:00'), INTERVAL 7 DAY)
      GROUP BY DATE(CONVERT_TZ(u.created_at, '+00:00', '+07:00'))
    `);

    const [data1month] = await conn.query(`
      ${baseQuery}
      WHERE CONVERT_TZ(u.created_at, '+00:00', '+07:00') 
      >= DATE_SUB(CONVERT_TZ(NOW(), '+00:00', '+07:00'), INTERVAL 30 DAY)
      GROUP BY DATE(CONVERT_TZ(u.created_at, '+00:00', '+07:00'))
    `);

    const [data3months] = await conn.query(`
      ${baseQuery}
      WHERE CONVERT_TZ(u.created_at, '+00:00', '+07:00') 
      >= DATE_SUB(CONVERT_TZ(NOW(), '+00:00', '+07:00'), INTERVAL 90 DAY)
      GROUP BY DATE(CONVERT_TZ(u.created_at, '+00:00', '+07:00'))
    `);

    res.status(200).json({
      message: "Berhasil mengambil data chart user",
      data: {
        "7days": fillMissingDates(data7days, 7),
        "1month": fillMissingDates(data1month, 30),
        "3months": fillMissingDates(data3months, 90),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil data chart user",
      error: error.message,
    });
  } finally {
    conn.release();
  }
};
