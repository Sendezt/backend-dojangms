const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/authJwt");

// Belt
const { getAllBelts } = require("../controllers/public/GetAllBeltController");
const {
  getPengumumanByUser,
  getBelumDibaca,
  tandaiBaca,
  tandaiBacaSemua,
} = require("../controllers/public/pengumumanController");

const {
  getDetailPengumuman,
} = require("../controllers/public/bacaPengumumanController");

/**
 * @swagger
 * tags:
 *   name: Public
 *   description: Public operations
 */

/**
 * @swagger
 * /api/public/get/belt:
 *   get:
 *     summary: Get all belts
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: A list of all belts
 */
router.get("/get/belt", getAllBelts);

/**
 * @swagger
 * /api/public/pengumuman:
 *   get:
 *     summary: Daftar pengumuman untuk user login (dengan status baca)
 *     tags: [Public]
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
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Berhasil
 */
router.get("/pengumuman", verifyToken, getPengumumanByUser);

/**
 * @swagger
 * /api/public/pengumuman/baca-semua:
 *   put:
 *     summary: Tandai semua pengumuman sudah dibaca
 *     tags: [Public]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil
 */
router.put("/pengumuman/baca-semua", verifyToken, tandaiBacaSemua);

/**
 * @swagger
 * /api/public/pengumuman/belum-dibaca:
 *   get:
 *     summary: Hitung pengumuman belum dibaca
 *     tags: [Public]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil
 */
router.get("/pengumuman/belum-dibaca", verifyToken, getBelumDibaca);

/**
 * @swagger
 * /api/public/pengumuman/{id}:
 *   get:
 *     summary: Detail satu pengumuman (dengan validasi akses dan otomatis tandai sudah dibaca)
 *     tags: [Public]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID pengumuman
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
 *                     id:
 *                       type: integer
 *                     judul:
 *                       type: string
 *                     isi:
 *                       type: string
 *                     target_type:
 *                       type: string
 *                     target_role:
 *                       type: string
 *                       nullable: true
 *                     kelas_id:
 *                       type: integer
 *                       nullable: true
 *                     status:
 *                       type: string
 *                     tanggal_publish:
 *                       type: string
 *                       format: date
 *                       nullable: true
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     scheduled_at:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     pembuat_nama:
 *                       type: string
 *                     sudah_dibaca:
 *                       type: integer
 *                       example: 1
 *                     notifikasi_id:
 *                       type: integer
 *                       nullable: true
 *       400:
 *         description: ID tidak valid
 *       404:
 *         description: Pengumuman tidak ditemukan atau akses ditolak
 *       500:
 *         description: Server error
 */
router.get("/pengumuman/:id", verifyToken, getDetailPengumuman);

/**
 * @swagger
 * /api/public/pengumuman/{id}/baca:
 *   put:
 *     summary: Tandai satu pengumuman sudah dibaca
 *     tags: [Public]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Berhasil
 *       404:
 *         description: Pengumuman tidak ditemukan
 */
router.put("/pengumuman/:id/baca", verifyToken, tandaiBaca);

module.exports = router;
