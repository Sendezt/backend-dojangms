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

module.exports = router;
