const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middlewares/authJwt");
const { authorizeRole } = require("../../middlewares/roleAdmin");

const {
  getPelatihKelas,
} = require("../../controllers/pelatih/jadwalKelas/getPelatihKelasController");
const {
  getPelatihKelasById,
} = require("../../controllers/pelatih/jadwalKelas/getPelatihKelasByIdController");
const {
  getJadwalPelatih,
} = require("../../controllers/pelatih/jadwalKelas/getJadwalPelatihController");
const {
  getDetailJadwalPelatih,
} = require("../../controllers/pelatih/jadwalKelas/getJadwalPelatihDetailController");
const {
  getMuridKelasPelatih,
} = require("../../controllers/pelatih/jadwalKelas/getMuridKelasPelatihController");

/**
 * @swagger
 * /api/pelatih/kelas:
 *   get:
 *     summary: Daftar kelas yang diampu oleh pelatih yang login
 *     tags: [Pelatih - Kelas]
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
 *         description: Cari berdasarkan nama kelas
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
 *                       jumlah_murid:
 *                         type: integer
 *                       jumlah_jadwal:
 *                         type: integer
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (bukan pelatih)
 *       500:
 *         description: Server error
 */
router.get("/kelas", verifyToken, getPelatihKelas);

/**
 * @swagger
 * /api/pelatih/kelas/{kelasId}:
 *   get:
 *     summary: Detail kelas yang diampu oleh pelatih (termasuk jadwal & murid)
 *     tags: [Pelatih - Kelas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: kelasId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: murid_page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: murid_limit
 *         schema: { type: integer, enum: [10,25,50,75,100,200], default: 10 }
 *       - in: query
 *         name: search_murid
 *         schema: { type: string }
 *         description: Cari murid berdasarkan nama, email, atau phone
 *     responses:
 *       200:
 *         description: Berhasil
 *       403:
 *         description: Akses ditolak (pelatih tidak mengampu kelas ini)
 *       404:
 *         description: Kelas tidak ditemukan
 *       500:
 *         description: Server error
 */
router.get("/kelas/:kelasId", verifyToken, getPelatihKelasById);

/**
 * @swagger
 * /api/pelatih/kelas/{kelasId}/murid:
 *   get:
 *     summary: Daftar murid di kelas yang diampu oleh pelatih yang sedang login
 *     tags: [Pelatih - Kelas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: kelasId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID kelas
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
 *         description: Cari berdasarkan nama, email, atau telepon
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
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       phone:
 *                         type: string
 *                       tanggal_lahir:
 *                         type: string
 *                         format: date
 *                       status:
 *                         type: string
 *                       tanggal_bergabung:
 *                         type: string
 *                         format: date
 *                       sabuk_saat_ini:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                         nullable: true
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
 *         description: ID kelas tidak valid
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (pelatih tidak mengampu kelas ini)
 *       404:
 *         description: Kelas tidak ditemukan (tidak ada di database)
 *       500:
 *         description: Server error
 */
router.get("/kelas/:kelasId/murid", verifyToken, getMuridKelasPelatih);

/**
 * @swagger
 * /api/pelatih/jadwal:
 *   get:
 *     summary: Ambil jadwal kelas yang diampu oleh pelatih yang sedang login
 *     tags: [Pelatih - Kelas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [aktif, nonaktif]
 *         description: Filter status jadwal
 *       - in: query
 *         name: hari
 *         schema:
 *           type: string
 *           enum: [senin, selasa, rabu, kamis, jumat, sabtu, minggu]
 *         description: Filter hari
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
 *                     $ref: '#/components/schemas/JadwalKelas'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get("/jadwal", verifyToken, getJadwalPelatih);

/**
 * @swagger
 * /api/pelatih/jadwal/{jadwalId}:
 *   get:
 *     summary: Detail jadwal kelas yang diampu oleh pelatih yang sedang login
 *     tags: [Pelatih - Kelas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jadwalId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID jadwal
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
 *                     nama:
 *                       type: string
 *                     tipe:
 *                       type: string
 *                     hari:
 *                       type: string
 *                       nullable: true
 *                     jam_mulai:
 *                       type: string
 *                     jam_selesai:
 *                       type: string
 *                     lokasi:
 *                       type: string
 *                     keterangan:
 *                       type: string
 *                       nullable: true
 *                     status:
 *                       type: string
 *                     periode:
 *                       type: object
 *                       properties:
 *                         effective_from:
 *                           type: string
 *                           format: date
 *                           nullable: true
 *                         effective_until:
 *                           type: string
 *                           format: date
 *                           nullable: true
 *                         tanggal_mulai:
 *                           type: string
 *                           format: date
 *                           nullable: true
 *                         tanggal_selesai:
 *                           type: string
 *                           format: date
 *                           nullable: true
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
 *                         jumlah_murid_aktif:
 *                           type: integer
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: ID jadwal tidak valid
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Jadwal tidak ditemukan atau akses ditolak
 *       500:
 *         description: Server error
 */
router.get("/jadwal/:jadwalId", verifyToken, getDetailJadwalPelatih);

module.exports = router;
