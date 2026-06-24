const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middlewares/authJwt");
const { authorizeRole } = require("../../middlewares/roleAdmin");

const {
  getInputableUjian,
} = require("../../controllers/pelatih/ujianKenaikanSabuk/getInputableUjianSabukController");
const {
  getPesertaUjianByUjianId,
} = require("../../controllers/pelatih/ujianKenaikanSabuk/getPesertaUjianByUjianIdController");
const {
  submitHasilUjian,
} = require("../../controllers/pelatih/ujianKenaikanSabuk/submitHasilUjianController");
const {
  getAllPesertaUjianByUjianId,
} = require("../../controllers/pelatih/ujianKenaikanSabuk/getAllPesertaByUjianController");
const {
  getEditableUjian,
} = require("../../controllers/pelatih/ujianKenaikanSabuk/getEditableUjianController");
const {
  editHasilUjian,
} = require("../../controllers/pelatih/ujianKenaikanSabuk/editHasilUjianController");

/**
 * @swagger
 * /api/pelatih/ujian/inputable:
 *   get:
 *     summary: "Daftar ujian sabuk yang masih bisa diinput hasil (masa input: mulai tanggal_mulai sampai H+1 bulan setelah selesai)"
 *     tags: [Pelatih - Ujian Sabuk]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil
 *       500:
 *         description: Server error
 */
router.get("/ujian/inputable", verifyToken, getInputableUjian);

/**
 * @swagger
 * /api/pelatih/ujian/editable:
 *   get:
 *     summary: Daftar ujian yang masih bisa diedit (H+1 sampai 3 bulan setelah selesai)
 *     tags: [Pelatih - Ujian Sabuk]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil
 *       500:
 *         description: Server error
 */
router.get("/ujian/editable", verifyToken, getEditableUjian);

/**
 * @swagger
 * /api/pelatih/ujian/{ujianId}/peserta:
 *   get:
 *     summary: Daftar peserta ujian dengan status 'terdaftar' (belum diinput hasil)
 *     tags: [Pelatih - Ujian Sabuk]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ujianId
 *         required: true
 *         schema: { type: integer }
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
 *       403:
 *         description: Ujian tidak dalam periode input
 *       404:
 *         description: Ujian tidak ditemukan
 *       500:
 *         description: Server error
 */
router.get("/ujian/:ujianId/peserta", verifyToken, getPesertaUjianByUjianId);

/**
 * @swagger
 * /api/pelatih/ujian/{ujianId}/peserta/all:
 *   get:
 *     summary: Daftar peserta ujian
 *     tags: [Pelatih - Ujian Sabuk]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ujianId
 *         required: true
 *         schema: { type: integer }
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
 *       403:
 *         description: Ujian tidak dalam periode input
 *       404:
 *         description: Ujian tidak ditemukan
 *       500:
 *         description: Server error
 */
router.get(
  "/ujian/:ujianId/peserta/all",
  verifyToken,
  getAllPesertaUjianByUjianId,
);

/**
 * @swagger
 * /api/pelatih/ujian/{ujianId}/peserta/{pesertaId}:
 *   put:
 *     summary: Update status peserta ujian (lulus/tidak_lulus) – hanya bisa 1 kali
 *     tags: [Pelatih - Ujian Sabuk]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ujianId
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: pesertaId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [lulus, tidak_lulus]
 *                 example: lulus
 *     responses:
 *       200:
 *         description: Berhasil
 *       400:
 *         description: Validasi gagal
 *       403:
 *         description: Ujian tidak dalam periode input
 *       404:
 *         description: Peserta tidak ditemukan
 *       409:
 *         description: Status sudah diinput sebelumnya (tidak dapat diubah lagi)
 *       500:
 *         description: Server error
 */
router.put("/ujian/:ujianId/peserta/:pesertaId", verifyToken, submitHasilUjian);

/**
 * @swagger
 * /api/pelatih/ujian/{ujianId}/peserta/{pesertaId}/edit:
 *   put:
 *     summary: Edit hasil ujian (hanya jika belum pernah diedit)
 *     description: |
 *       Endpoint ini digunakan untuk mengubah status kelulusan peserta ujian.
 *
 *       **Syarat:**
 *       - Ujian masih dalam periode edit (H+1 sampai 3 bulan setelah `tanggal_selesai`).
 *       - Peserta sudah memiliki status `lulus` atau `tidak_lulus` (bukan `terdaftar`).
 *       - Peserta belum pernah diedit sebelumnya (`tanggal_edit` masih `NULL`).
 *
 *       **Perilaku:**
 *       - Jika status baru sama dengan status lama → hanya `tanggal_edit` yang diisi.
 *       - Jika upgrade (`tidak_lulus` → `lulus`) → tambahkan sabuk baru ke `user_belts`.
 *       - Jika downgrade (`lulus` → `tidak_lulus`) → hapus sabuk tujuan dan aktifkan kembali sabuk asal.
 *       - `tanggal_lulus` tidak berubah.
 *     tags: [Pelatih - Ujian Sabuk]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ujianId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ujian sabuk
 *         example: 6
 *       - in: path
 *         name: pesertaId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID peserta ujian (dari tabel `peserta_ujian`)
 *         example: 5
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [lulus, tidak_lulus]
 *                 description: Status kelulusan baru
 *                 example: lulus
 *           example:
 *             status: lulus
 *     responses:
 *       200:
 *         description: Hasil ujian berhasil diedit
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
 *                     user_id:
 *                       type: integer
 *                     belt_asal_id:
 *                       type: integer
 *                     belt_tujuan_id:
 *                       type: integer
 *                     status:
 *                       type: string
 *                     tanggal_lulus:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     tanggal_edit:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *             example:
 *               success: true
 *               message: "Hasil ujian berhasil diedit"
 *               data:
 *                 id: 5
 *                 user_id: 10
 *                 belt_asal_id: 2
 *                 belt_tujuan_id: 3
 *                 status: "lulus"
 *                 tanggal_lulus: "2026-06-20 10:30:00"
 *                 tanggal_edit: "2026-06-22 14:20:00"
 *       400:
 *         description: Validasi gagal (ID tidak valid, status tidak sesuai, atau peserta masih 'terdaftar')
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
 *               invalidUjian:
 *                 value:
 *                   success: false
 *                   message: "ID ujian tidak valid"
 *               invalidPeserta:
 *                 value:
 *                   success: false
 *                   message: "ID peserta tidak valid"
 *               invalidStatus:
 *                 value:
 *                   success: false
 *                   message: "Status harus 'lulus' atau 'tidak_lulus'"
 *               masihTerdaftar:
 *                 value:
 *                   success: false
 *                   message: "Status peserta masih 'terdaftar', gunakan endpoint submit untuk input pertama"
 *       403:
 *         description: Ujian tidak dalam periode edit
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
 *               message: "Edit hasil ujian hanya dapat dilakukan mulai H+1 sampai 3 bulan setelah tanggal selesai"
 *       404:
 *         description: Ujian atau peserta tidak ditemukan
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
 *               ujianNotFound:
 *                 value:
 *                   success: false
 *                   message: "Ujian tidak ditemukan"
 *               pesertaNotFound:
 *                 value:
 *                   success: false
 *                   message: "Peserta tidak ditemukan dalam ujian ini"
 *       409:
 *         description: Hasil sudah pernah diedit sebelumnya
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
 *               message: "Hasil ujian sudah pernah diedit dan tidak dapat diubah lagi"
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
 *               message: "Gagal mengedit hasil ujian"
 *               error: "Database connection error"
 */
router.put(
  "/ujian/:ujianId/peserta/:pesertaId/edit",
  verifyToken,
  editHasilUjian,
);

module.exports = router;
