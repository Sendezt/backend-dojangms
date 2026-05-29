const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middlewares/authJwt");
const { authorizeRole } = require("../../middlewares/roleAdmin");

// latihan wajib
const {
  createJadwalLatihanWajib,
} = require("../../controllers/admin/latihanWajibController");
const {
  getJadwalLatihanWajib,
} = require("../../controllers/admin/latihanWajibController");
const {
  getJadwalLatihanWajibById,
} = require("../../controllers/admin/latihanWajibController");

/**
 * @swagger
 * tags:
 *   - name: Latihan Wajib - Jadwal
 *     description: Kelola jadwal latihan utama mingguan (recurring)
 *   - name:  Latihan Wajib - Libur
 *     description: Kelola tanggal libur / pengecualian latihan wajib
 */

// ── Jadwal latihan wajib ──────────────────────

/**
 * @swagger
 * /api/admin/latihan-wajib:
 *   get:
 *     summary: Ambil semua jadwal latihan wajib
 *     tags: [Latihan Wajib - Jadwal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [aktif, nonaktif]
 *         required: false
 *         description: Filter berdasarkan status jadwal
 *     responses:
 *       200:
 *         description: Daftar jadwal latihan wajib berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/JadwalLatihanWajib'
 *       401:
 *         description: Token tidak valid atau tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Akses ditolak (bukan admin)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Kesalahan server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/latihan-wajib", getJadwalLatihanWajib);

/**
 * @swagger
 * /api/admin/latihan-wajib/{id}:
 *   get:
 *     summary: Ambil detail satu jadwal latihan wajib
 *     tags: [Latihan Wajib - Jadwal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID jadwal latihan wajib
 *     responses:
 *       200:
 *         description: Detail jadwal berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/JadwalLatihanWajib'
 *       401:
 *         description: Token tidak valid atau tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Akses ditolak (bukan admin)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Jadwal tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Jadwal tidak ditemukan.
 *       500:
 *         description: Kesalahan server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/latihan-wajib/:id", getJadwalLatihanWajibById);

/**
 * @swagger
 * /api/admin/latihan-wajib:
 *   post:
 *     summary: Tambah jadwal latihan wajib baru
 *     tags: [Latihan Wajib - Jadwal]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [hari, jam_mulai, jam_selesai]
 *             properties:
 *               hari:
 *                 type: string
 *                 enum: [senin, selasa, rabu, kamis, jumat, sabtu, minggu]
 *                 example: senin
 *               jam_mulai:
 *                 type: string
 *                 example: "16:00:00"
 *                 description: Format HH:MM:SS
 *               jam_selesai:
 *                 type: string
 *                 example: "18:00:00"
 *                 description: Format HH:MM:SS, harus lebih besar dari jam_mulai
 *               lokasi:
 *                 type: string
 *                 nullable: true
 *                 example: GOR Utama
 *               keterangan:
 *                 type: string
 *                 nullable: true
 *                 example: Latihan rutin mingguan
 *               status:
 *                 type: string
 *                 enum: [aktif, nonaktif]
 *                 default: aktif
 *     responses:
 *       201:
 *         description: Jadwal latihan wajib berhasil ditambahkan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Jadwal latihan wajib berhasil ditambahkan.
 *                 data:
 *                   $ref: '#/components/schemas/JadwalLatihanWajib'
 *       400:
 *         description: Validasi gagal
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               fieldKosong:
 *                 summary: Field wajib kosong
 *                 value:
 *                   success: false
 *                   message: hari, jam_mulai, dan jam_selesai wajib diisi.
 *               hariTidakValid:
 *                 summary: Nilai hari tidak valid
 *                 value:
 *                   success: false
 *                   message: "hari harus salah satu dari: senin, selasa, rabu, kamis, jumat, sabtu, minggu."
 *               jamTidakLogis:
 *                 summary: jam_selesai lebih kecil dari jam_mulai
 *                 value:
 *                   success: false
 *                   message: jam_selesai harus lebih besar dari jam_mulai.
 *       401:
 *         description: Token tidak valid atau tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Akses ditolak (bukan admin)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Kesalahan server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/latihan-wajib", createJadwalLatihanWajib);

module.exports = router;
