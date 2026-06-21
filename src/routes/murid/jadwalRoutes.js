const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middlewares/authJwt");
const { authorizeRole } = require("../../middlewares/roleAdmin");

const {
  getAllJadwalMurid,
} = require("../../controllers/murid/jadwal/getJadwalController");

/**
 * @swagger
 * /api/murid/jadwal:
 *   get:
 *     summary: Daftar semua jadwal kelas yang diikuti oleh murid login
 *     tags: [Murid - Jadwal]
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
 *         description: Cari berdasarkan nama jadwal atau nama kelas
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [aktif, nonaktif], default: 'aktif' }
 *       - in: query
 *         name: hari
 *         schema: { type: string, enum: [senin, selasa, rabu, kamis, jumat, sabtu, minggu] }
 *       - in: query
 *         name: kelas_id
 *         schema: { type: integer }
 *         description: Filter berdasarkan ID kelas
 *       - in: query
 *         name: start_date
 *         schema: { type: string, format: date }
 *         description: Tanggal mulai (untuk filter rentang)
 *       - in: query
 *         name: end_date
 *         schema: { type: string, format: date }
 *         description: Tanggal selesai (untuk filter rentang)
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
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       jadwal_nama:
 *                         type: string
 *                       tipe:
 *                         type: string
 *                       hari:
 *                         type: string
 *                       effective_from:
 *                         type: string
 *                         format: date
 *                       effective_until:
 *                         type: string
 *                         format: date
 *                       tanggal_mulai:
 *                         type: string
 *                         format: date
 *                       tanggal_selesai:
 *                         type: string
 *                         format: date
 *                       jam_mulai:
 *                         type: string
 *                       jam_selesai:
 *                         type: string
 *                       lokasi:
 *                         type: string
 *                       status:
 *                         type: string
 *                       kelas_id:
 *                         type: integer
 *                       kelas_nama:
 *                         type: string
 *                       kelas_deskripsi:
 *                         type: string
 *                       kelas_status:
 *                         type: string
 *                       status_jadwal:
 *                         type: string
 *                         enum: [akan_datang, berlangsung, selesai, aktif]
 *                 summary:
 *                   type: object
 *                   properties:
 *                     total_jadwal:
 *                       type: integer
 *       403:
 *         description: Akses ditolak (kelas_id tidak valid)
 *       500:
 *         description: Server error
 */
router.get("/jadwal", verifyToken, getAllJadwalMurid);

module.exports = router;
