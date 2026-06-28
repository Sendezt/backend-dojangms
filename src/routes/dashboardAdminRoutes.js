const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/authJwt");

const {
  getAdminDashboard,
} = require("../controllers/admin/dashboard/dashboardController");
const {
  getAttendanceTrend,
} = require("../controllers/admin/dashboard/getAttadanceController");
const {
  getUserGrowth,
} = require("../controllers/admin/dashboard/getUserGrowthController");
const {
  getPelatihDashboard,
} = require("../controllers/pelatih/dashboard/dashboardController");
const {
  getMuridDashboard,
} = require("../controllers/murid/dashboard/dashboardController");

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Dashboard Admin – ringkasan semua data
 *     tags:
 *       - Admin - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data dashboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         active:
 *                           type: integer
 *                         inactive:
 *                           type: integer
 *                         murid:
 *                           type: integer
 *                         pelatih:
 *                           type: integer
 *                         admin:
 *                           type: integer
 *                         new_this_month:
 *                           type: integer
 *
 *                     classes:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         aktif:
 *                           type: integer
 *                         nonaktif:
 *                           type: integer
 *
 *                     attendance:
 *                       type: object
 *                       properties:
 *                         today:
 *                           type: object
 *                           properties:
 *                             hadir:
 *                               type: integer
 *                             izin:
 *                               type: integer
 *                             sakit:
 *                               type: integer
 *                             alpha:
 *                               type: integer
 *                         total:
 *                           type: integer
 *                         persentase_hadir:
 *                           type: number
 *                           format: float
 *
 *                     competitions:
 *                       type: object
 *                       properties:
 *                         berlangsung:
 *                           type: integer
 *                         akan_datang:
 *                           type: integer
 *                         total_peserta_aktif:
 *                           type: integer
 *
 *                     belt_exams:
 *                       type: object
 *                       properties:
 *                         akan_datang:
 *                           type: integer
 *                         selesai_bulan_ini:
 *                           type: integer
 *                         belum_diinput:
 *                           type: integer
 *
 *                     recent_activities:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           tipe:
 *                             type: string
 *                           deskripsi:
 *                             type: string
 *                           waktu:
 *                             type: string
 *                             format: date-time
 *
 *       401:
 *         description: Unauthorized
 *
 *       403:
 *         description: Forbidden
 *
 *       500:
 *         description: Internal Server Error
 */
router.get("/dashboard", verifyToken, getAdminDashboard);

/**
 * @swagger
 * /api/admin/dashboard/attendance-trend:
 *   get:
 *     summary: Data absensi untuk grafik (daily, weekly, monthly)
 *     tags: [Admin - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *           default: daily
 *       - in: query
 *         name: start_date
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: end_date
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Berhasil
 *       500:
 *         description: Server error
 */
router.get("/dashboard/attendance-trend", verifyToken, getAttendanceTrend);

/**
 * @swagger
 * /api/admin/dashboard/user-growth:
 *   get:
 *     summary: Data pertumbuhan user per bulan untuk grafik
 *     tags: [Admin - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema: { type: integer, default: 2026 }
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [murid, pelatih, admin] }
 *     responses:
 *       200:
 *         description: Berhasil
 *       500:
 *         description: Server error
 */
router.get("/dashboard/user-growth", verifyToken, getUserGrowth);

/**
 * @swagger
 * /api/admin/pelatih/dashboard:
 *   get:
 *     summary: Dashboard Pelatih – ringkasan data kelas, absensi, jadwal, dan event terkait
 *     tags: [Pelatih - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_kelas:
 *                       type: integer
 *                     total_murid:
 *                       type: integer
 *                     absensi_hari_ini:
 *                       type: object
 *                       properties:
 *                         hadir:
 *                           type: integer
 *                         izin:
 *                           type: integer
 *                         sakit:
 *                           type: integer
 *                         alpha:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                     jadwal_hari_ini:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           nama:
 *                             type: string
 *                           jam_mulai:
 *                             type: string
 *                           jam_selesai:
 *                             type: string
 *                           lokasi:
 *                             type: string
 *                           kelas_nama:
 *                             type: string
 *                     kejuaraan_terdekat:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         start_date:
 *                           type: string
 *                           format: date
 *                         end_date:
 *                           type: string
 *                           format: date
 *                         location:
 *                           type: string
 *                     ujian_terdekat:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: integer
 *                         lokasi:
 *                           type: string
 *                         tanggal_mulai:
 *                           type: string
 *                           format: date
 *                         tanggal_selesai:
 *                           type: string
 *                           format: date
 *                     kelas_diampu:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           nama:
 *                             type: string
 *       500:
 *         description: Server error
 */
router.get("/pelatih/dashboard", verifyToken, getPelatihDashboard);

/**
 * @swagger
 * /api/admin/murid/dashboard:
 *   get:
 *     summary: Dashboard murid – ringkasan kelas, absensi, jadwal, pengumuman, prestasi, ujian
 *     tags: [Murid - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/murid/dashboard", verifyToken, getMuridDashboard);

module.exports = router;
