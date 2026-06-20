const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middlewares/authJwt");
const { authorizeRole } = require("../../middlewares/roleAdmin");

const {
  createUjianSabuk,
} = require("../../controllers/admin/ujian/createUjianKenaikanSabuk");
const {
  getAllUjianSabuk,
} = require("../../controllers/admin/ujian/getAllUjianKenaikanSabukController");
const {
  getUjianSabukById,
} = require("../../controllers/admin/ujian/getUjianSabukByIdController");
const {
  updateUjianSabuk,
} = require("../../controllers/admin/ujian/updateUjianKenaikanSabukController");
const {
  softDeleteUjianSabuk,
} = require("../../controllers/admin/ujian/softDeleteUjianKenaikanController");
const {
  restoreUjianSabuk,
} = require("../../controllers/admin/ujian/restoreUjianKenaikanSabuk");
const {
  getCalonPesertaUjian,
} = require("../../controllers/admin/ujian/getCalonPesertaUjianController");
const {
  getUjianTerjadwal,
} = require("../../controllers/admin/ujian/getUjianTerjadwalController");
const {
  addBulkPesertaUjian,
} = require("../../controllers/admin/ujian/addBulkPesertaUjianController.js");
const {
  bulkHardDeletePesertaUjian,
} = require("../../controllers/admin/ujian/bulkHardDeletePesertaUjianController.js");
const {
  getPesertaUjianByUjianId,
} = require("../../controllers/admin/ujian/getPesertaUjianByUjianIdController.js");
const {
  getDeletedUjianSabuk,
} = require("../../controllers/admin/ujian/getDeletedUjianSabukController.js");
const {
  getSelesaiUjianSabuk,
} = require("../../controllers/admin/ujian/getSelesaiUjianSabukController.js");
const {
  updateStatusUjianOtomatis,
} = require("../../controllers/admin/ujian/updateStatusUjianOtomatisController.js");
const {
  getAllUjian,
} = require("../../controllers/admin/ujian/getAllUjianController.js");
const {
  getHasilPesertaByUjianId,
} = require("../../controllers/admin/ujian/getHasilPesertaByUjianIdController.js");

/**
 * @swagger
 * /api/admin/ujian-kenaikan-sabuk:
 *   post:
 *     summary: Buat jadwal ujian kenaikan sabuk (kota cukup tanggal, provinsi input range)
 *     tags: [Admin - Ujian Kenaikan Sabuk]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - level_ujian
 *             properties:
 *               level_ujian:
 *                 type: string
 *                 enum: [kota, provinsi]
 *                 default: kota
 *               tanggal:
 *                 type: string
 *                 format: date
 *                 description: Wajib jika level_ujian = kota
 *               tanggal_mulai:
 *                 type: string
 *                 format: date
 *                 description: Wajib jika level_ujian = provinsi
 *               tanggal_selesai:
 *                 type: string
 *                 format: date
 *                 description: Wajib jika level_ujian = provinsi
 *               lokasi:
 *                 type: string
 *               keterangan:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [terjadwal, selesai, dibatalkan]
 *                 default: terjadwal
 *           examples:
 *             ujianKota:
 *               summary: Ujian tingkat kota
 *               value:
 *                 level_ujian: "kota"
 *                 tanggal: "2026-07-15"
 *                 lokasi: "GOR Kota Salatiga"
 *                 keterangan: "Ujian kenaikan sabuk putih ke kuning"
 *             ujianProvinsi:
 *               summary: Ujian tingkat provinsi
 *               value:
 *                 level_ujian: "provinsi"
 *                 tanggal_mulai: "2026-08-10"
 *                 tanggal_selesai: "2026-08-12"
 *                 lokasi: "GOR Provinsi Jawa Tengah"
 *                 keterangan: "Ujian kenaikan sabuk merah ke hitam"
 *     responses:
 *       201:
 *         description: Berhasil
 *       400:
 *         description: Validasi gagal
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/ujian-kenaikan-sabuk", verifyToken, createUjianSabuk);

/**
 * @swagger
 * /api/admin/ujian-kenaikan-sabuk/all:
 *   get:
 *     summary: Daftar ujian kenaikan sabuk (dengan filter dan pagination)
 *     tags: [Admin - Ujian Kenaikan Sabuk]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Halaman yang diminta
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           enum: [10, 25, 50, 75, 100, 200]
 *           default: 10
 *         description: Jumlah data per halaman
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [terjadwal, selesai, dibatalkan]
 *         description: Filter berdasarkan status ujian
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [kota, provinsi]
 *         description: Filter berdasarkan level ujian (kota/provinsi)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Cari berdasarkan lokasi atau keterangan
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar ujian
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     current_page:
 *                       type: integer
 *                     per_page:
 *                       type: integer
 *                     total_page:
 *                       type: integer
 *                     total_data:
 *                       type: integer
 *                     has_next:
 *                       type: boolean
 *                     has_prev:
 *                       type: boolean
 *                 summary:
 *                   type: object
 *                   properties:
 *                     total: { type: integer }
 *                     terjadwal: { type: integer }
 *                     selesai: { type: integer }
 *                     dibatalkan: { type: integer }
 *                     kota: { type: integer }
 *                     provinsi: { type: integer }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       tanggal_mulai:
 *                         type: string
 *                         format: date
 *                       tanggal_selesai:
 *                         type: string
 *                         format: date
 *                       level_ujian:
 *                         type: string
 *                         enum: [kota, provinsi]
 *                       lokasi:
 *                         type: string
 *                         nullable: true
 *                       keterangan:
 *                         type: string
 *                         nullable: true
 *                       status:
 *                         type: string
 *                         enum: [terjadwal, selesai, dibatalkan]
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Parameter tidak valid (limit di luar range, dll)
 *       401:
 *         description: Token tidak valid atau tidak ditemukan
 *       500:
 *         description: Kesalahan server
 */
router.get("/ujian-kenaikan-sabuk/all", verifyToken, getAllUjianSabuk);

/**
 * @swagger
 * /api/admin/ujian-kenaikan-sabuk/terjadwal:
 *   get:
 *     summary: Ambil semua ujian dengan status terjadwal dan belum dihapus (untuk dropdown)
 *     tags: [Admin - Ujian Kenaikan Sabuk]
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
 *                 message:
 *                   type: string
 *                 summary:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     kota:
 *                       type: integer
 *                     provinsi:
 *                       type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       tanggal_mulai:
 *                         type: string
 *                         format: date
 *                       tanggal_selesai:
 *                         type: string
 *                         format: date
 *                       level_ujian:
 *                         type: string
 *                       lokasi:
 *                         type: string
 *                       keterangan:
 *                         type: string
 *       500:
 *         description: Server error
 */
router.get("/ujian-kenaikan-sabuk/terjadwal", verifyToken, getUjianTerjadwal);

/**
 * @swagger
 * /api/admin/ujian-kenaikan-sabuk/deleted:
 *   get:
 *     summary: Daftar ujian yang telah di-soft-delete (deleted_at tidak null)
 *     description: Mengembalikan semua ujian sabuk yang sudah dihapus (soft delete). Mendukung pagination, pencarian, dan filter level.
 *     tags: [Admin - Ujian Kenaikan Sabuk]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Cari berdasarkan lokasi atau keterangan
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [kota, provinsi]
 *         description: Filter berdasarkan level ujian
 *     responses:
 *       200:
 *         description: Berhasil mengambil data ujian yang dihapus
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     current_page:
 *                       type: integer
 *                     per_page:
 *                       type: integer
 *                     total_page:
 *                       type: integer
 *                     total_data:
 *                       type: integer
 *                     has_next:
 *                       type: boolean
 *                     has_prev:
 *                       type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       tanggal_mulai:
 *                         type: string
 *                         format: date
 *                       tanggal_selesai:
 *                         type: string
 *                         format: date
 *                       level_ujian:
 *                         type: string
 *                       lokasi:
 *                         type: string
 *                         nullable: true
 *                       keterangan:
 *                         type: string
 *                         nullable: true
 *                       status:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       deleted_at:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *       400:
 *         description: Parameter tidak valid
 *       401:
 *         description: Token tidak valid atau tidak ditemukan
 *       500:
 *         description: Kesalahan server
 */
router.get("/ujian-kenaikan-sabuk/deleted", verifyToken, getDeletedUjianSabuk);

/**
 * @swagger
 * /api/admin/ujian-kenaikan-sabuk/selesai:
 *   get:
 *     summary: Daftar ujian dengan status 'selesai' dan belum dihapus
 *     description: Mengembalikan semua ujian yang statusnya selesai (bukan dihapus). Mendukung pagination, pencarian, dan filter level.
 *     tags: [Admin - Ujian Kenaikan Sabuk]
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
 *         description: Cari berdasarkan lokasi atau keterangan
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [kota, provinsi]
 *     responses:
 *       200:
 *         description: Berhasil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     current_page:
 *                       type: integer
 *                     per_page:
 *                       type: integer
 *                     total_page:
 *                       type: integer
 *                     total_data:
 *                       type: integer
 *                     has_next:
 *                       type: boolean
 *                     has_prev:
 *                       type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       tanggal_mulai:
 *                         type: string
 *                         format: date
 *                       tanggal_selesai:
 *                         type: string
 *                         format: date
 *                       level_ujian:
 *                         type: string
 *                       lokasi:
 *                         type: string
 *                         nullable: true
 *                       keterangan:
 *                         type: string
 *                         nullable: true
 *                       status:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Parameter tidak valid
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/ujian-kenaikan-sabuk/selesai", verifyToken, getSelesaiUjianSabuk);

/**
 * @swagger
 * /api/admin/ujian-kenaikan-sabuk/{id}:
 *   get:
 *     summary: Detail ujian kenaikan sabuk (termasuk daftar peserta)
 *     tags: [Admin - Ujian Kenaikan Sabuk]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ujian sabuk
 *     responses:
 *       200:
 *         description: Berhasil mengambil detail ujian
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
 *                     tanggal_mulai:
 *                       type: string
 *                       format: date
 *                     tanggal_selesai:
 *                       type: string
 *                       format: date
 *                     level_ujian:
 *                       type: string
 *                     lokasi:
 *                       type: string
 *                       nullable: true
 *                     keterangan:
 *                       type: string
 *                       nullable: true
 *                     status:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     total_peserta:
 *                       type: integer
 *                     peserta:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           murid:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               nama:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                               telepon:
 *                                 type: string
 *                           belt_asal:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               nama:
 *                                 type: string
 *                           belt_tujuan:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               nama:
 *                                 type: string
 *                           status:
 *                             type: string
 *                           nilai:
 *                             type: number
 *                             nullable: true
 *                           catatan:
 *                             type: string
 *                             nullable: true
 *       400:
 *         description: ID tidak valid
 *       401:
 *         description: Token tidak valid
 *       404:
 *         description: Ujian tidak ditemukan
 *       500:
 *         description: Kesalahan server
 */
router.get("/ujian-kenaikan-sabuk/:id", verifyToken, getUjianSabukById);

/**
 * @swagger
 * /api/admin/ujian-kenaikan-sabuk/{id}:
 *   put:
 *     summary: Update data ujian kenaikan sabuk
 *     tags: [Admin - Ujian Kenaikan Sabuk]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ujian
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               level_ujian:
 *                 type: string
 *                 enum: [kota, provinsi]
 *               tanggal:
 *                 type: string
 *                 format: date
 *                 description: Gunakan untuk ujian kota (1 hari)
 *               tanggal_mulai:
 *                 type: string
 *                 format: date
 *                 description: Gunakan untuk ujian provinsi
 *               tanggal_selesai:
 *                 type: string
 *                 format: date
 *                 description: Gunakan untuk ujian provinsi
 *               lokasi:
 *                 type: string
 *               keterangan:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [terjadwal, selesai, dibatalkan]
 *     responses:
 *       200:
 *         description: Ujian berhasil diperbarui
 *       400:
 *         description: Validasi gagal
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Ujian tidak ditemukan
 *       409:
 *         description: Bentrok dengan ujian lain
 *       500:
 *         description: Server error
 */
router.put("/ujian-kenaikan-sabuk/:id", verifyToken, updateUjianSabuk);

/**
 * @swagger
 * /api/admin/ujian-kenaikan-sabuk/{id}:
 *   delete:
 *     summary: Soft delete ujian sabuk (hanya jika belum memiliki peserta)
 *     tags: [Admin - Ujian Kenaikan Sabuk]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Ujian berhasil dihapus
 *       409:
 *         description: Ujian sudah memiliki peserta, tidak dapat dihapus
 *       404:
 *         description: Ujian tidak ditemukan
 *       500:
 *         description: Server error
 */
router.delete("/ujian-kenaikan-sabuk/:id", verifyToken, softDeleteUjianSabuk);

/**
 * @swagger
 * /api/admin/ujian-kenaikan-sabuk/{id}/restore:
 *   patch:
 *     summary: Restore ujian sabuk yang telah di-soft-delete
 *     tags: [Admin - Ujian Kenaikan Sabuk]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Ujian berhasil dipulihkan
 *       404:
 *         description: Ujian tidak ditemukan atau belum dihapus
 *       500:
 *         description: Server error
 */
router.patch(
  "/ujian-kenaikan-sabuk/:id/restore",
  verifyToken,
  restoreUjianSabuk,
);

/**
 * @swagger
 * /api/admin/ujian-kenaikan-sabuk/{ujianId}/calon-peserta:
 *   get:
 *     summary: Daftar murid yang memenuhi syarat untuk mengikuti ujian (belum terdaftar)
 *     tags: [Admin - Ujian Kenaikan Sabuk]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ujianId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, enum: [10,25,50,75,100,200], default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Cari berdasarkan nama, email, atau telepon
 *     responses:
 *       200:
 *         description: Berhasil
 *       404:
 *         description: Ujian tidak ditemukan
 *       500:
 *         description: Server error
 */
router.get(
  "/ujian-kenaikan-sabuk/:ujianId/calon-peserta",
  verifyToken,
  getCalonPesertaUjian,
);

/**
 * @swagger
 * /api/admin/ujian-kenaikan-sabuk/{ujianId}/peserta/terdaftar:
 *   get:
 *     summary: Daftar peserta ujian dengan status 'terdaftar' (belum dinilai)
 *     tags: [Admin - Ujian Kenaikan Sabuk]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ujianId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ujian sabuk
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
 *         description: Cari berdasarkan nama murid, email, atau telepon
 *     responses:
 *       200:
 *         description: Berhasil
 *       404:
 *         description: Ujian tidak ditemukan
 *       500:
 *         description: Kesalahan server
 */
router.get(
  "/ujian-kenaikan-sabuk/:ujianId/peserta/terdaftar",
  verifyToken,
  getPesertaUjianByUjianId,
);

/**
 * @swagger
 * /api/admin/ujian-kenaikan-sabuk/{ujianId}/peserta/bulk:
 *   post:
 *     summary: Tambah banyak peserta ke ujian sekaligus (bulk)
 *     description: |
 *       - Jika hanya mengirim array of integer (user_id), maka sistem akan secara otomatis menentukan `belt_tujuan_id` = sabuk dengan level satu tingkat di atas sabuk peserta saat ini.
 *       - Jika ingin menentukan sabuk tujuan secara manual, kirim array of object dengan properti `user_id` dan `belt_tujuan_id`.
 *       - Peserta yang sudah terdaftar atau tidak memenuhi syarat akan dilewati dan dicatat dalam daftar error.
 *     tags: [Admin - Ujian Kenaikan Sabuk]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ujianId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ujian sabuk
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - peserta_list
 *             properties:
 *               peserta_list:
 *                 type: array
 *                 description: Daftar peserta (bisa array integer atau array object)
 *                 items:
 *                   oneOf:
 *                     - type: integer
 *                       description: ID user (akan naik 1 tingkat sabuk)
 *                     - type: object
 *                       properties:
 *                         user_id:
 *                           type: integer
 *                         belt_tujuan_id:
 *                           type: integer
 *                           description: Opsional, ID sabuk tujuan (jika tidak diisi, akan ditentukan otomatis)
 *           examples:
 *             simple:
 *               summary: Daftar peserta dengan ID saja (naik 1 tingkat)
 *               value:
 *                 peserta_list: [26, 22, 10, 7, 17]
 *             custom_belt:
 *               summary: Daftar peserta dengan sabuk tujuan khusus
 *               value:
 *                 peserta_list:
 *                   - user_id: 26
 *                   - user_id: 22
 *                     belt_tujuan_id: 8
 *                   - user_id: 10
 *     responses:
 *       201:
 *         description: Proses bulk selesai (beberapa mungkin gagal)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 success_count:
 *                   type: integer
 *                 error_count:
 *                   type: integer
 *                 success:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user_id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       belt_asal_id:
 *                         type: integer
 *                       belt_tujuan_id:
 *                         type: integer
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user_id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       error:
 *                         type: string
 *             example:
 *               message: "Proses bulk peserta selesai"
 *               success_count: 3
 *               error_count: 1
 *               success:
 *                 - user_id: 26
 *                   name: "Budi Handoko"
 *                   belt_asal_id: 5
 *                   belt_tujuan_id: 6
 *                 - user_id: 10
 *                   name: "Murid Empat"
 *                   belt_asal_id: 1
 *                   belt_tujuan_id: 2
 *               errors:
 *                 - user_id: 7
 *                   name: "Murid Tiga"
 *                   error: "Sudah terdaftar di ujian ini"
 *       400:
 *         description: Input tidak valid (ID ujian salah, peserta_list bukan array, atau kosong)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Ujian tidak ditemukan atau sudah dihapus
 *       500:
 *         description: Kesalahan server
 */
router.post(
  "/ujian-kenaikan-sabuk/:ujianId/peserta/bulk",
  verifyToken,
  addBulkPesertaUjian,
);

/**
 * @swagger
 * /api/admin/ujian-kenaikan-sabuk/{ujianId}/peserta/bulk:
 *   delete:
 *     summary: Hapus banyak peserta dari ujian secara permanen (hard delete)
 *     description: Menghapus data peserta_ujian berdasarkan daftar user_id yang diberikan.
 *     tags: [Admin - Ujian Kenaikan Sabuk]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ujianId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ujian sabuk
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_ids
 *             properties:
 *               user_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [26, 22, 10]
 *     responses:
 *       200:
 *         description: Berhasil menghapus
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 deleted_count:
 *                   type: integer
 *                 not_found:
 *                   type: array
 *                   items:
 *                     type: integer
 *                 deleted:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user_id:
 *                         type: integer
 *                       name:
 *                         type: string
 *       400:
 *         description: Input tidak valid (ID ujian salah, user_ids bukan array atau kosong)
 *       404:
 *         description: Ujian tidak ditemukan atau tidak ada peserta yang ditemukan untuk dihapus
 *       500:
 *         description: Kesalahan server
 */
router.delete(
  "/ujian-kenaikan-sabuk/:ujianId/peserta/bulk",
  verifyToken,
  bulkHardDeletePesertaUjian,
);

/**
 * @swagger
 * /api/admin/ujian-rekap:
 *   get:
 *     summary: Daftar semua ujian sabuk (dengan filter status, tanggal, dan rekap peserta)
 *     tags: [Admin - Rekap Ujian Sabuk]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [terjadwal, selesai, dibatalkan]
 *         description: Filter status ujian
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Cari berdasarkan lokasi atau keterangan
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter tanggal mulai >=
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter tanggal selesai <=
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
 *                       level_ujian:
 *                         type: string
 *                       lokasi:
 *                         type: string
 *                       keterangan:
 *                         type: string
 *                       status:
 *                         type: string
 *                       tanggal_mulai:
 *                         type: string
 *                         format: date
 *                       tanggal_selesai:
 *                         type: string
 *                         format: date
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       rekap:
 *                         type: object
 *                         properties:
 *                           total_peserta:
 *                             type: integer
 *                           terdaftar:
 *                             type: integer
 *                           lulus:
 *                             type: integer
 *                           tidak_lulus:
 *                             type: integer
 *                           sudah_diedit:
 *                             type: integer
 *                           persentase_lulus:
 *                             type: number
 *                             example: 75.50
 *       400:
 *         description: Parameter tidak valid
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get("/ujian-rekap", verifyToken, getAllUjian);

/**
 * @swagger
 * /api/admin/ujian/{ujianId}/hasil-peserta:
 *   get:
 *     summary: Dapatkan daftar peserta beserta hasil ujian (rekap hasil)
 *     tags: [Admin - Rekap Ujian Sabuk]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ujianId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ujian
 *         example: 6
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Cari berdasarkan nama, email, atau telepon
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [terdaftar, lulus, tidak_lulus]
 *         description: Filter berdasarkan status
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
 *                     ujian:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         level_ujian:
 *                           type: string
 *                         lokasi:
 *                           type: string
 *                         keterangan:
 *                           type: string
 *                         status:
 *                           type: string
 *                         tanggal_mulai:
 *                           type: string
 *                           format: date
 *                         tanggal_selesai:
 *                           type: string
 *                           format: date
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total_peserta:
 *                           type: integer
 *                         terdaftar:
 *                           type: integer
 *                         lulus:
 *                           type: integer
 *                         tidak_lulus:
 *                           type: integer
 *                         sudah_diedit:
 *                           type: integer
 *                         persentase_lulus:
 *                           type: number
 *                         persentase_tidak_lulus:
 *                           type: number
 *                     peserta:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           peserta_id:
 *                             type: integer
 *                           user:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               name:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                               phone:
 *                                 type: string
 *                               tanggal_lahir:
 *                                 type: string
 *                                 format: date
 *                           belt_asal:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               name:
 *                                 type: string
 *                           belt_tujuan:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               name:
 *                                 type: string
 *                           status:
 *                             type: string
 *                           tanggal_lulus:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                           tanggal_edit:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *       400:
 *         description: ID ujian tidak valid atau filter status salah
 *       404:
 *         description: Ujian tidak ditemukan
 *       500:
 *         description: Server error
 */
router.get(
  "/ujian/:ujianId/hasil-peserta",
  verifyToken,
  getHasilPesertaByUjianId,
);

module.exports = router;
