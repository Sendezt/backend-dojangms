const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middlewares/authJwt");
const { authorizeRole } = require("../../middlewares/roleAdmin");
const {
  getAbsensiForm,
  submitAbsensi,
  editAbsensi,
} = require("../../controllers/pelatih/absensi/absensiController");
const {
  getAbsensiHistory,
} = require("../../controllers/pelatih/absensi/absensiHistoryController");
const {
  updateAbsensi,
} = require("../../controllers/pelatih/absensi/updateAbsensiController");

/**
 * @swagger
 * /api/pelatih/absensi/{jadwalId}:
 *   get:
 *     summary: Ambil form absensi – daftar murid di kelas beserta status absensi saat ini
 *     tags: [Pelatih - Absensi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jadwalId
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: tanggal
 *         required: true
 *         schema: { type: string, format: date }
 *         description: Tanggal absensi (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Berhasil
 *       400:
 *         description: Parameter tidak valid
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Jadwal tidak ditemukan atau akses ditolak
 *       500:
 *         description: Server error
 */
router.get("/absensi/:jadwalId", verifyToken, getAbsensiForm);

/**
 * @swagger
 * /api/pelatih/absensi:
 *   post:
 *     summary: Simpan atau perbarui absensi untuk suatu jadwal dan tanggal
 *     tags: [Pelatih - Absensi]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jadwal_id
 *               - tanggal
 *               - daftar_absensi
 *             properties:
 *               jadwal_id:
 *                 type: integer
 *               tanggal:
 *                 type: string
 *                 format: date
 *               daftar_absensi:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - user_id
 *                     - status
 *                   properties:
 *                     user_id:
 *                       type: integer
 *                     status:
 *                       type: string
 *                       enum: [hadir, izin, sakit, alpha]
 *                     catatan:
 *                       type: string
 *     responses:
 *       200:
 *         description: Absensi berhasil disimpan
 *       400:
 *         description: Validasi gagal
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Jadwal tidak ditemukan atau akses ditolak
 *       500:
 *         description: Server error
 */
router.post("/absensi", verifyToken, submitAbsensi);

/**
 * @swagger
 * /api/pelatih/absensi/{jadwalId}/{tanggal}:
 *   put:
 *     summary: Edit absensi pada tanggal tertentu (maksimal 7 hari yang lalu)
 *     description: |
 *       Endpoint ini digunakan untuk mengedit data absensi pada sesi tertentu.
 *
 *       **Batasan:**
 *       - Hanya dapat mengedit absensi yang berumur maksimal 7 hari dari hari ini.
 *       - Tidak ada validasi jam (bisa diedit kapan saja).
 *       - Hanya pelatih yang mengampu kelas tersebut yang memiliki akses.
 *     tags: [Pelatih - Absensi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jadwalId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID jadwal
 *         example: 3
 *       - in: path
 *         name: tanggal
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Tanggal sesi absensi yang akan diedit (format YYYY-MM-DD)
 *         example: "2026-06-18"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - daftar_absensi
 *             properties:
 *               daftar_absensi:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - user_id
 *                     - status
 *                   properties:
 *                     user_id:
 *                       type: integer
 *                       description: ID murid
 *                       example: 5
 *                     status:
 *                       type: string
 *                       enum: [hadir, izin, sakit, alpha]
 *                       description: Status kehadiran baru
 *                       example: "hadir"
 *                     catatan:
 *                       type: string
 *                       nullable: true
 *                       description: Catatan tambahan (opsional)
 *                       example: "Tepat waktu"
 *           example:
 *             daftar_absensi:
 *               - user_id: 5
 *                 status: "hadir"
 *                 catatan: "Tepat waktu"
 *               - user_id: 7
 *                 status: "izin"
 *                 catatan: "Sakit"
 *     responses:
 *       200:
 *         description: Absensi berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *             example:
 *               success: true
 *               message: "Absensi berhasil diperbarui"
 *       400:
 *         description: Validasi gagal (parameter tidak valid, body tidak sesuai, atau status tidak valid)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *             examples:
 *               invalidJadwal:
 *                 value:
 *                   success: false
 *                   message: "jadwalId tidak valid"
 *               invalidTanggal:
 *                 value:
 *                   success: false
 *                   message: "tanggal tidak valid"
 *               invalidBody:
 *                 value:
 *                   success: false
 *                   message: "daftar_absensi harus array"
 *               invalidStatus:
 *                 value:
 *                   success: false
 *                   message: "Status harus salah satu: hadir, izin, sakit, alpha"
 *       403:
 *         description: Melewati batas 7 hari (tidak bisa diedit)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *             example:
 *               success: false
 *               message: "Absensi hanya dapat diedit maksimal 7 hari setelah tanggal latihan"
 *       404:
 *         description: Jadwal tidak ditemukan, akses ditolak, atau data absensi untuk user tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *             examples:
 *               jadwalNotFound:
 *                 value:
 *                   success: false
 *                   message: "Jadwal tidak ditemukan atau akses ditolak"
 *               absensiNotFound:
 *                 value:
 *                   success: false
 *                   message: "Absensi user 5 tidak ditemukan"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 *             example:
 *               success: false
 *               message: "Gagal memperbarui absensi"
 *               error: "Database connection error"
 */
router.put("/absensi/:jadwalId/:tanggal", verifyToken, updateAbsensi);

/**
 * @swagger
 * /api/pelatih/absensi/history/{jadwalId}:
 *   get:
 *     summary: History absensi per sesi (per tanggal) untuk suatu jadwal
 *     tags: [Pelatih - Absensi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jadwalId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID jadwal
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum: [editable]
 *         description: |
 *           Filter sesi yang ditampilkan:
 *           - **editable** : hanya sesi yang masih bisa diedit (tanggal >= 7 hari yang lalu)
 *           - (tidak dikirim) : semua sesi yang sudah lewat (≤ hari ini)
 *         example: editable
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Halaman
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           enum: [10, 25, 50, 75, 100, 200]
 *           default: 10
 *         description: Jumlah data per halaman
 *       - in: query
 *         name: tanggal_akhir
 *         schema:
 *           type: string
 *           format: date
 *         description: Batas tanggal maksimal (misal 2026-06-01). Secara default hanya menampilkan tanggal ≤ hari ini.
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
 *                     jadwal_id:
 *                       type: integer
 *                     jadwal_nama:
 *                       type: string
 *                     filter_editable:
 *                       type: boolean
 *                       description: Indikator apakah filter editable aktif
 *                     history:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           tanggal:
 *                             type: string
 *                             format: date
 *                           total_murid:
 *                             type: integer
 *                           hadir:
 *                             type: integer
 *                           izin:
 *                             type: integer
 *                           sakit:
 *                             type: integer
 *                           alpha:
 *                             type: integer
 *                           persentase_hadir:
 *                             type: integer
 *                 meta:
 *                   type: object
 *                   properties:
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         current_page:
 *                           type: integer
 *                         per_page:
 *                           type: integer
 *                         total_page:
 *                           type: integer
 *                         total_data:
 *                           type: integer
 *                         has_next:
 *                           type: boolean
 *                         has_prev:
 *                           type: boolean
 *       400:
 *         description: Parameter tidak valid
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Jadwal tidak ditemukan atau akses ditolak
 *       500:
 *         description: Server error
 */
router.get("/absensi/history/:jadwalId", verifyToken, getAbsensiHistory);

module.exports = router;
