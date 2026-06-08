const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middlewares/authJwt");
const { authorizeRole } = require("../../middlewares/roleAdmin");

const {
  createJadwal,
} = require("../../controllers/admin/jadwal/createJadwalController");
const { getAllJadwal } = require("../../controllers/admin/jadwal/getAlljadwal");
const {
  getJadwalById,
} = require("../../controllers/admin/jadwal/getJadwalById");
const {
  updateJadwal,
} = require("../../controllers/admin/jadwal/updateJadwalController");
const {
  softDeleteJadwal,
} = require("../../controllers/admin/jadwal/softDeleteJadwalController");

const {
  addLiburJadwal,
} = require("../../controllers/admin/jadwal/addJadwalLiburController");
const {
  deleteLiburJadwal,
} = require("../../controllers/admin/jadwal/deleteJadwalLiburController");
const {
  getLiburJadwal,
} = require("../../controllers/admin/jadwal/getJadwalLiburController");
const {
  getAllLibur,
} = require("../../controllers/admin/jadwal/getAllJadwalLiburController");
const {
  bulkAddLiburJadwal,
} = require("../../controllers/admin/jadwal/addJadwalLiburBulkController");

const {
  createLiburGlobal,
} = require("../../controllers/admin/jadwal/createLiburGlobalController");
const {
  bulkCreateLiburGlobal,
} = require("../../controllers/admin/jadwal/createLiburGlobalBulkController");
const {
  getAllLiburGlobal,
} = require("../../controllers/admin/jadwal/getAllLiburGlobalController");
const {
  updateLiburGlobal,
} = require("../../controllers/admin/jadwal/updateLiburGlobalController");
const {
  deleteLiburGlobal,
} = require("../../controllers/admin/jadwal/deleteLiburGlobalController");

/**
 * @swagger
 * /api/admin/jadwal/create:
 *   post:
 *     summary: Tambah jadwal baru (latihan wajib, training camp, atau kelas)
 *     tags: [Admin - Jadwal]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipe
 *               - nama
 *               - jam_mulai
 *               - jam_selesai
 *               - lokasi
 *             properties:
 *               tipe:
 *                 type: string
 *                 enum: [latihan_wajib, training_camp, kelas]
 *               nama:
 *                 type: string
 *               kelas_id:
 *                 type: integer
 *                 description: Wajib jika tipe = kelas
 *               hari:
 *                 type: string
 *                 enum: [senin, selasa, rabu, kamis, jumat, sabtu, minggu]
 *                 description: Wajib untuk latihan_wajib dan kelas recurring
 *               effective_from:
 *                 type: string
 *                 format: date
 *                 description: Wajib untuk latihan_wajib dan kelas recurring
 *               effective_until:
 *                 type: string
 *                 format: date
 *                 description: Opsional (akhir berlaku)
 *               tanggal_mulai:
 *                 type: string
 *                 format: date
 *                 description: Wajib untuk training_camp dan kelas one-time (pengganti)
 *               tanggal_selesai:
 *                 type: string
 *                 format: date
 *                 description: Wajib untuk training_camp dan kelas one-time
 *               jam_mulai:
 *                 type: string
 *                 format: time
 *               jam_selesai:
 *                 type: string
 *                 format: time
 *               lokasi:
 *                 type: string
 *               keterangan:
 *                 type: string
 *           examples:
 *             latihan_wajib_recurring:
 *               summary: Latihan wajib (berulang mingguan)
 *               value:
 *                 tipe: "latihan_wajib"
 *                 nama: "Latihan Wajib - Senin"
 *                 hari: "senin"
 *                 effective_from: "2026-01-01"
 *                 jam_mulai: "19:00"
 *                 jam_selesai: "21:00"
 *                 lokasi: "Dojang Utama"
 *             kelas_recurring:
 *               summary: Kelas dengan jadwal mingguan
 *               value:
 *                 tipe: "kelas"
 *                 nama: "Kelas Taekwondo Pemula"
 *                 kelas_id: 1
 *                 hari: "rabu"
 *                 effective_from: "2026-06-01"
 *                 jam_mulai: "16:00"
 *                 jam_selesai: "18:00"
 *                 lokasi: "GOR Utama"
 *             kelas_one_time:
 *               summary: Kelas satu kali (pengganti)
 *               value:
 *                 tipe: "kelas"
 *                 nama: "Pengganti Latihan - Selasa"
 *                 kelas_id: 1
 *                 tanggal_mulai: "2026-07-13"
 *                 tanggal_selesai: "2026-07-13"
 *                 jam_mulai: "16:00"
 *                 jam_selesai: "18:00"
 *                 lokasi: "GOR Utama"
 *             training_camp:
 *               summary: Training camp (rentang beberapa hari)
 *               value:
 *                 tipe: "training_camp"
 *                 nama: "Training Camp Nasional"
 *                 tanggal_mulai: "2026-07-10"
 *                 tanggal_selesai: "2026-07-12"
 *                 jam_mulai: "08:00"
 *                 jam_selesai: "17:00"
 *                 lokasi: "Bandung"
 *     responses:
 *       201:
 *         description: Jadwal berhasil dibuat
 *       400:
 *         description: Validasi gagal (field wajib kosong, format salah, atau kombinasi tidak valid)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Kelas tidak ditemukan (jika tipe kelas)
 *       409:
 *         description: Jadwal bentrok dengan jadwal lain di lokasi yang sama
 *       500:
 *         description: Server error
 */
router.post("/jadwal/create", verifyToken, createJadwal);

/**
 * @swagger
 * /api/admin/jadwal:
 *   get:
 *     summary: Get all jadwal (with filters, pagination, summary)
 *     tags: [Admin - Jadwal]
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
 *         name: tipe
 *         schema: { type: string, enum: [latihan_wajib, training_camp, kelas] }
 *       - in: query
 *         name: kelas_id
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [aktif, nonaktif] }
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 summary:
 *                   type: object
 *                   properties:
 *                     total_jadwal: { type: integer }
 *                     total_latihan_wajib: { type: integer }
 *                     total_training_camp: { type: integer }
 *                     total_kelas: { type: integer }
 *                     total_aktif: { type: string }
 *                     total_nonaktif: { type: string }
 *                 pagination:
 *                   type: object
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       400: { description: Parameter tidak valid }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       500: { description: Server error }
 */
router.get("/jadwal", getAllJadwal);

/**
 * @swagger
 * /api/admin/jadwal/{id}:
 *   get:
 *     summary: Get detail jadwal by ID
 *     tags: [Admin - Jadwal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: integer }
 *                     tipe: { type: string }
 *                     nama: { type: string }
 *                     kelas_id: { type: integer, nullable: true }
 *                     kelas_nama: { type: string, nullable: true }
 *                     hari: { type: string, nullable: true }
 *                     effective_from: { type: string, format: date, nullable: true }
 *                     effective_until: { type: string, format: date, nullable: true }
 *                     tanggal_mulai: { type: string, format: date, nullable: true }
 *                     tanggal_selesai: { type: string, format: date, nullable: true }
 *                     jam_mulai: { type: string }
 *                     jam_selesai: { type: string }
 *                     lokasi: { type: string }
 *                     keterangan: { type: string, nullable: true }
 *                     status: { type: string }
 *                     dibuat_oleh: { type: integer, nullable: true }
 *                     created_at: { type: string, format: date-time }
 *                     updated_at: { type: string, format: date-time }
 *       400: { description: ID tidak valid }
 *       404: { description: Jadwal tidak ditemukan }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       500: { description: Server error }
 */
router.get("/jadwal/:id", getJadwalById);

/**
 * @swagger
 * /api/admin/jadwal/update/{id}:
 *   patch:
 *     summary: Edit jadwal (partial update) – mendukung semua tipe jadwal (latihan_wajib, training_camp, kelas)
 *     tags: [Admin - Jadwal]
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
 *               nama:
 *                 type: string
 *                 description: Nama jadwal (bisa diubah untuk semua tipe)
 *               hari:
 *                 type: string
 *                 enum: [senin, selasa, rabu, kamis, jumat, sabtu, minggu]
 *                 description: Hanya untuk latihan_wajib dan kelas
 *               effective_from:
 *                 type: string
 *                 format: date
 *                 description: Hanya untuk latihan_wajib dan kelas
 *               effective_until:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *                 description: Hanya untuk latihan_wajib dan kelas
 *               tanggal_mulai:
 *                 type: string
 *                 format: date
 *                 description: Hanya untuk training_camp
 *               tanggal_selesai:
 *                 type: string
 *                 format: date
 *                 description: Hanya untuk training_camp
 *               jam_mulai:
 *                 type: string
 *                 format: time
 *               jam_selesai:
 *                 type: string
 *                 format: time
 *               lokasi:
 *                 type: string
 *               keterangan:
 *                 type: string
 *                 nullable: true
 *               status:
 *                 type: string
 *                 enum: [aktif, nonaktif]
 *               kelas_id:
 *                 type: integer
 *                 description: Hanya untuk jadwal tipe kelas (bisa dipindah ke kelas lain)
 *           examples:
 *             updateLatihanWajib:
 *               summary: Update jadwal latihan wajib (recurring)
 *               value:
 *                 hari: "rabu"
 *                 jam_mulai: "20:00"
 *                 jam_selesai: "22:00"
 *                 lokasi: "Dojang Timur"
 *             updateTrainingCamp:
 *               summary: Update jadwal training camp (one-time)
 *               value:
 *                 tanggal_mulai: "2026-08-01"
 *                 tanggal_selesai: "2026-08-03"
 *                 jam_mulai: "09:00"
 *                 jam_selesai: "16:00"
 *             updateKelas:
 *               summary: Update jadwal kelas (misal pindah hari, jam, atau kelas)
 *               value:
 *                 nama: "Jadwal Kelas Lanjutan"
 *                 hari: "jumat"
 *                 jam_mulai: "15:00"
 *                 jam_selesai: "17:00"
 *                 lokasi: "GOR Selatan"
 *                 effective_from: "2026-07-01"
 *                 kelas_id: 2
 *     responses:
 *       200:
 *         description: Jadwal berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 data: { $ref: '#/components/schemas/Jadwal' }
 *       400:
 *         description: Validasi gagal (field tidak sesuai tipe atau format salah)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Jadwal tidak ditemukan
 *       409:
 *         description: Jadwal bentrok dengan jadwal lain di lokasi yang sama
 *       500:
 *         description: Server error
 */
router.patch("/jadwal/update/:id", verifyToken, updateJadwal);

/**
 * @swagger
 * /api/admin/jadwal/softdelete/{id}:
 *   patch:
 *     summary: Soft delete jadwal (ubah status menjadi nonaktif)
 *     tags: [Admin - Jadwal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID jadwal yang akan dinonaktifkan
 *     responses:
 *       200:
 *         description: Jadwal berhasil dinonaktifkan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Jadwal'
 *       400:
 *         description: ID tidak valid atau jadwal sudah nonaktif
 *       401:
 *         description: Token tidak valid
 *       403:
 *         description: Akses ditolak (bukan admin)
 *       404:
 *         description: Jadwal tidak ditemukan
 *       500:
 *         description: Kesalahan server
 */
router.patch("/jadwal/softdelete/:id", verifyToken, softDeleteJadwal);

/**
 * @swagger
 * /api/admin/jadwal/libur/all:
 *   get:
 *     summary: Dapatkan semua hari libur dari semua jadwal (dengan filter & pagination)
 *     tags: [Admin - Jadwal Libur]
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
 *         name: jadwal_id
 *         schema: { type: integer }
 *         description: Filter berdasarkan ID jadwal
 *       - in: query
 *         name: tanggal_start
 *         schema: { type: string, format: date }
 *         description: Filter tanggal mulai (YYYY-MM-DD)
 *       - in: query
 *         name: tanggal_end
 *         schema: { type: string, format: date }
 *         description: Filter tanggal akhir (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Berhasil mengambil data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 pagination:
 *                   type: object
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: integer }
 *                       jadwal_id: { type: integer }
 *                       tanggal: { type: string, format: date }
 *                       keterangan: { type: string, nullable: true }
 *                       created_at: { type: string, format: date-time }
 *                       jadwal_nama: { type: string }
 *                       jadwal_tipe: { type: string }
 *       400: { description: Parameter tidak valid }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       500: { description: Server error }
 */
router.get("/jadwal/libur/all", getAllLibur);

/**
 * @swagger
 * /api/admin/jadwal/{id}/libur:
 *   post:
 *     summary: Tambah hari libur untuk suatu jadwal (pengecualian)
 *     tags: [Admin - Jadwal Libur]
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
 *             required:
 *               - tanggal
 *             properties:
 *               tanggal:
 *                 type: string
 *                 format: date
 *               keterangan:
 *                 type: string
 *     responses:
 *       201:
 *         description: Libur berhasil ditambahkan
 *       400: { description: Parameter tidak valid }
 *       409: { description: Tanggal sudah menjadi libur }
 *       404: { description: Jadwal tidak ditemukan }
 */
router.post("/jadwal/:id/libur", verifyToken, addLiburJadwal);

/**
 * @swagger
 * /api/admin/jadwal/{id}/libur/bulk:
 *   post:
 *     summary: Tambah beberapa hari libur sekaligus untuk suatu jadwal
 *     tags: [Admin - Jadwal Libur]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID jadwal
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tanggal_list
 *             properties:
 *               tanggal_list:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: date
 *                 description: Array tanggal libur (format YYYY-MM-DD)
 *                 example: ["2026-07-04", "2026-07-05"]
 *               keterangan:
 *                 type: string
 *                 description: Keterangan libur (opsional, berlaku untuk semua tanggal)
 *                 example: "Libur Nasional"
 *     responses:
 *       201:
 *         description: Sebagian atau semua tanggal berhasil ditambahkan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 summary:
 *                   type: object
 *                   properties:
 *                     total_requested:
 *                       type: integer
 *                     total_success:
 *                       type: integer
 *                     total_failed:
 *                       type: integer
 *                 details:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           jadwal_id:
 *                             type: integer
 *                           tanggal:
 *                             type: string
 *                             format: date
 *                           keterangan:
 *                             type: string
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                     failed:
 *                       type: object
 *                       properties:
 *                         invalid_format:
 *                           type: array
 *                           items:
 *                             type: string
 *                         already_exist:
 *                           type: array
 *                           items:
 *                             type: string
 *       400:
 *         description: Input tidak valid (ID jadwal salah, tanggal_list bukan array kosong, format tanggal salah)
 *       401:
 *         description: Token tidak valid
 *       403:
 *         description: Akses ditolak (bukan admin)
 *       404:
 *         description: Jadwal tidak ditemukan
 *       409:
 *         description: Semua tanggal sudah menjadi libur
 *       500:
 *         description: Kesalahan server
 */
router.post("/jadwal/:id/libur/bulk", verifyToken, bulkAddLiburJadwal);

/**
 * @swagger
 * /api/admin/jadwal/{id}/libur/{tanggal}:
 *   delete:
 *     summary: Hapus satu hari libur dari suatu jadwal berdasarkan tanggal
 *     tags: [Admin - Jadwal Libur]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID jadwal
 *       - in: path
 *         name: tanggal
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Tanggal libur yang akan dihapus (format YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Hari libur berhasil dihapus
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Parameter tidak valid (ID jadwal atau format tanggal salah)
 *       401:
 *         description: Token tidak valid
 *       403:
 *         description: Akses ditolak (bukan admin)
 *       404:
 *         description: Hari libur tidak ditemukan untuk jadwal tersebut
 *       500:
 *         description: Kesalahan server
 */
router.delete("/jadwal/:id/libur/:tanggal", verifyToken, deleteLiburJadwal);

/**
 * @swagger
 * /api/admin/jadwal/{id}/libur:
 *   get:
 *     summary: Dapatkan daftar hari libur untuk suatu jadwal
 *     tags: [Admin - Jadwal Libur]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID jadwal
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar libur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       jadwal_id:
 *                         type: integer
 *                       tanggal:
 *                         type: string
 *                         format: date
 *                       keterangan:
 *                         type: string
 *                         nullable: true
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: ID jadwal tidak valid
 *       401:
 *         description: Token tidak valid
 *       403:
 *         description: Akses ditolak (bukan admin)
 *       404:
 *         description: Jadwal tidak ditemukan (atau tidak ada libur, namun tetap 200 dengan array kosong)
 *       500:
 *         description: Kesalahan server
 */
router.get("/jadwal/:id/libur", verifyToken, getLiburJadwal);

/**
 * @swagger
 * /api/admin/jadwal/libur-global:
 *   post:
 *     summary: Tambah satu libur global
 *     tags: [Admin - Jadwal Libur Global]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tanggal
 *             properties:
 *               tanggal:
 *                 type: string
 *                 format: date
 *                 example: "2026-08-17"
 *               keterangan:
 *                 type: string
 *                 example: "Hari Kemerdekaan"
 *     responses:
 *       201:
 *         description: Libur global berhasil ditambahkan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     tanggal:
 *                       type: string
 *                       format: date
 *                     keterangan:
 *                       type: string
 *                       nullable: true
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Tanggal tidak valid
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Tanggal sudah terdaftar
 *       500:
 *         description: Server error
 */
router.post("/jadwal/libur-global", verifyToken, createLiburGlobal);

/**
 * @swagger
 * /api/admin/jadwal/libur-global/bulk:
 *   post:
 *     summary: Tambah banyak libur global sekaligus
 *     tags: [Admin - Jadwal Libur Global]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - tanggal
 *                   properties:
 *                     tanggal:
 *                       type: string
 *                       format: date
 *                     keterangan:
 *                       type: string
 *                 example:
 *                   - tanggal: "2026-08-17"
 *                     keterangan: "Hari Kemerdekaan"
 *                   - tanggal: "2026-12-25"
 *                     keterangan: "Natal"
 *     responses:
 *       201:
 *         description: Berhasil menambahkan sebagian atau seluruh libur
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
 *         description: Input tidak valid
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Semua tanggal sudah terdaftar
 *       500:
 *         description: Server error
 */
router.post("/jadwal/libur-global/bulk", verifyToken, bulkCreateLiburGlobal);

/**
 * @swagger
 * /api/admin/jadwal/libur-global/get:
 *   get:
 *     summary: Dapatkan daftar semua libur global (dengan filter tanggal & pagination)
 *     tags: [Admin - Jadwal Libur Global]
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
 *         name: tanggal_start
 *         schema: { type: string, format: date }
 *         description: Filter tanggal mulai (YYYY-MM-DD)
 *       - in: query
 *         name: tanggal_end
 *         schema: { type: string, format: date }
 *         description: Filter tanggal akhir (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Berhasil mengambil data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 pagination:
 *                   type: object
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       tanggal:
 *                         type: string
 *                         format: date
 *                       keterangan:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Parameter tidak valid
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get("/jadwal/libur-global/get", getAllLiburGlobal);

/**
 * @swagger
 * /api/admin/jadwal/libur-global/update/{id}:
 *   patch:
 *     summary: Perbarui sebagian atau seluruh data libur global berdasarkan ID
 *     tags: [Admin - Jadwal Libur Global]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID libur global
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tanggal:
 *                 type: string
 *                 format: date
 *                 description: Tanggal libur baru
 *                 example: "2026-12-25"
 *               keterangan:
 *                 type: string
 *                 nullable: true
 *                 description: Keterangan libur
 *                 example: "Libur Hari Natal"
 *           examples:
 *             updateTanggal:
 *               summary: Ubah tanggal saja
 *               value:
 *                 tanggal: "2026-12-25"
 *             updateKeterangan:
 *               summary: Ubah keterangan saja
 *               value:
 *                 keterangan: "Libur Hari Natal"
 *             updateKeduanya:
 *               summary: Ubah tanggal dan keterangan
 *               value:
 *                 tanggal: "2026-12-25"
 *                 keterangan: "Libur Hari Natal"
 *             hapusKeterangan:
 *               summary: Hapus keterangan
 *               value:
 *                 keterangan: null
 *     responses:
 *       200:
 *         description: Libur global berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Libur global berhasil diperbarui"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     tanggal:
 *                       type: string
 *                       format: date
 *                       example: "2026-12-25"
 *                     keterangan:
 *                       type: string
 *                       nullable: true
 *                       example: "Libur Hari Natal"
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: ID tidak valid, format tanggal salah, atau tidak ada field yang dikirim
 *       401:
 *         description: Token tidak valid
 *       403:
 *         description: Akses ditolak (bukan admin)
 *       404:
 *         description: Libur global tidak ditemukan
 *       409:
 *         description: Tanggal sudah terdaftar sebagai libur global
 *       500:
 *         description: Kesalahan server
 */
router.patch("/jadwal/libur-global/update/:id", verifyToken, updateLiburGlobal);

/**
 * @swagger
 * /api/admin/jadwal/libur-global/delete/{id}:
 *   delete:
 *     summary: Hapus libur global berdasarkan ID
 *     tags: [Admin - Jadwal Libur Global]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID libur global
 *     responses:
 *       200:
 *         description: Libur global berhasil dihapus
 *       400:
 *         description: ID tidak valid
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Libur global tidak ditemukan
 *       500:
 *         description: Server error
 */
router.delete(
  "/jadwal/libur-global/delete/:id",
  verifyToken,
  deleteLiburGlobal,
);

module.exports = router;
