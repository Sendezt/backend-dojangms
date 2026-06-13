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
router.patch("/ujian-kenaikan-sabuk/:id/restore", verifyToken, restoreUjianSabuk);

module.exports = router;
