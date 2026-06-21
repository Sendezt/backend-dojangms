const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middlewares/authJwt");
const { authorizeRole } = require("../../middlewares/roleAdmin");

const {
  getKelasMurid,
} = require("../../controllers/murid/kelas/getKelasController");
const {
  getDetailKelasMurid,
} = require("../../controllers/murid/kelas/getKelasDetailController");

/**
 * @swagger
 * /api/murid/kelas:
 *   get:
 *     summary: Daftar kelas yang diikuti oleh murid yang sedang login
 *     tags: [Murid - Kelas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           enum: [10, 25, 50, 75, 100, 200]
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Cari berdasarkan nama atau deskripsi
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [aktif, nonaktif]
 *         description: Filter status kelas (opsional)
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
 *                       nama:
 *                         type: string
 *                       deskripsi:
 *                         type: string
 *                       status:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       tanggal_bergabung:
 *                         type: string
 *                         format: date
 *                       jumlah_jadwal_aktif:
 *                         type: integer
 *                       jumlah_pelatih:
 *                         type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/kelas", verifyToken, getKelasMurid);

/**
 * @swagger
 * /api/murid/kelas/{kelasId}:
 *   get:
 *     summary: Detail kelas yang diikuti murid (dengan riwayat absensi)
 *     tags: [Murid - Kelas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: kelasId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID kelas
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
 *                     kelas:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         nama:
 *                           type: string
 *                         deskripsi:
 *                           type: string
 *                         status:
 *                           type: string
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                         tanggal_bergabung:
 *                           type: string
 *                           format: date
 *                         jumlah_murid_aktif:
 *                           type: integer
 *                         jumlah_pelatih_aktif:
 *                           type: integer
 *                     jadwal:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           jadwal_nama:
 *                             type: string
 *                           hari:
 *                             type: string
 *                           effective_from:
 *                             type: string
 *                             format: date
 *                           effective_until:
 *                             type: string
 *                             format: date
 *                           tanggal_mulai:
 *                             type: string
 *                             format: date
 *                           tanggal_selesai:
 *                             type: string
 *                             format: date
 *                           jam_mulai:
 *                             type: string
 *                           jam_selesai:
 *                             type: string
 *                           lokasi:
 *                             type: string
 *                     absensi:
 *                       type: object
 *                       properties:
 *                         riwayat:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               absensi_id:
 *                                 type: integer
 *                               tanggal:
 *                                 type: string
 *                                 format: date
 *                               status:
 *                                 type: string
 *                               catatan:
 *                                 type: string
 *                               waktu_absen:
 *                                 type: string
 *                                 format: date-time
 *                               jadwal_id:
 *                                 type: integer
 *                               jadwal_nama:
 *                                 type: string
 *                               jam_mulai:
 *                                 type: string
 *                               jam_selesai:
 *                                 type: string
 *                               hari:
 *                                 type: string
 *                         statistik:
 *                           type: object
 *                           properties:
 *                             total_pertemuan:
 *                               type: integer
 *                             hadir:
 *                               type: integer
 *                             izin:
 *                               type: integer
 *                             sakit:
 *                               type: integer
 *                             alpha:
 *                               type: integer
 *                             persentase_kehadiran:
 *                               type: number
 *       403:
 *         description: Anda tidak terdaftar di kelas ini
 *       404:
 *         description: Kelas tidak ditemukan
 *       500:
 *         description: Server error
 */
router.get("/kelas/:kelasId", verifyToken, getDetailKelasMurid);

module.exports = router;
