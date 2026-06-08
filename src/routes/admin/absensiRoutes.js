const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middlewares/authJwt");
const { authorizeRole } = require("../../middlewares/roleAdmin");

const {
  batchAbsensi,
} = require("../../controllers/admin/absensi/batchAbsensiController");
const {
  getRekapAbsensi,
} = require("../../controllers/admin/absensi/getRekapAbsensiController");
const {
  getRiwayatAbsensiMurid,
} = require("../../controllers/admin/absensi/getRiwayatAbsensiMuridController");
const {
  updateAbsensi,
} = require("../../controllers/admin/absensi/updateAbsensiController");

/**
 * @swagger
 * /api/admin/absensi/batch:
 *   post:
 *     summary: Input absensi banyak murid dalam satu kelas pada suatu tanggal (berdasarkan jadwal)
 *     tags: [Admin - Absensi]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - kelas_id
 *               - tanggal
 *               - jadwal_id
 *               - absensi_list
 *             properties:
 *               kelas_id:
 *                 type: integer
 *                 description: ID kelas (harus aktif)
 *               tanggal:
 *                 type: string
 *                 format: date
 *                 description: Tanggal pelaksanaan (YYYY-MM-DD)
 *               jadwal_id:
 *                 type: integer
 *                 description: ID jadwal (wajib, akan divalidasi hari & rentang efektif)
 *               absensi_list:
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
 *                 description: Daftar absensi murid
 *     responses:
 *       201:
 *         description: Berhasil mencatat absensi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 summary:
 *                   type: object
 *                 details:
 *                   type: object
 *       400:
 *         description: Validasi gagal (misal hari tidak sesuai, tanggal di luar efektif, murid tidak terdaftar)
 *       401:
 *         description: Token tidak valid
 *       403:
 *         description: Akses ditolak
 *       404:
 *         description: Kelas atau jadwal tidak ditemukan
 *       409:
 *         description: Semua murid sudah punya absensi di tanggal tersebut
 *       500:
 *         description: Server error
 */
router.post("/absensi/batch", verifyToken, batchAbsensi);

/**
 * @swagger
 * /api/admin/absensi:
 *   get:
 *     summary: Rekap absensi dengan filter (kelas, jadwal, murid, status, rentang tanggal)
 *     tags: [Admin - Absensi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, enum: [10,25,50,75,100,200], default: 10 }
 *       - in: query
 *         name: kelas_id
 *         schema: { type: integer }
 *       - in: query
 *         name: jadwal_id
 *         schema: { type: integer }
 *       - in: query
 *         name: user_id
 *         schema: { type: integer }
 *         description: ID murid
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [hadir, izin, sakit, alpha] }
 *       - in: query
 *         name: tanggal_start
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: tanggal_end
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Berhasil mengambil data
 *       400:
 *         description: Parameter tidak valid
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get("/absensi", getRekapAbsensi);

/**
 * @swagger
 * /api/admin/absensi/murid/{userId}:
 *   get:
 *     summary: Riwayat absensi seorang murid (dengan filter kelas, status, rentang tanggal)
 *     tags: [Admin - Absensi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, enum: [10,25,50,75,100,200], default: 10 }
 *       - in: query
 *         name: kelas_id
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [hadir, izin, sakit, alpha] }
 *       - in: query
 *         name: tanggal_start
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: tanggal_end
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Berhasil mengambil riwayat
 *       400:
 *         description: Invalid Parameter
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Murid tidak ditemukan
 *       500:
 *         description: Server error
 */
router.get("/absensi/murid/:userId", getRiwayatAbsensiMurid);

/**
 * @swagger
 * /api/admin/absensi/{id}:
 *   put:
 *     summary: Update status/catatan absensi (hanya untuk data dalam 7 hari terakhir)
 *     tags: [Admin - Absensi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [hadir, izin, sakit, alpha]
 *               catatan:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Berhasil update
 *       400:
 *         description: Data lebih dari 7 hari atau status tidak valid
 *       404:
 *         description: Absensi tidak ditemukan
 *       500:
 *         description: Server error
 */
router.put("/absensi/:id", updateAbsensi);

module.exports = router;
