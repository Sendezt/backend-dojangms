const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middlewares/authJwt");
const { authorizeRole } = require("../../middlewares/roleAdmin");

const {
  updateHasilPeserta,
} = require("../../controllers/pelatih/kejuaraan/updateHasilPesertaController");
const {
  getInputableKejuaraan,
} = require("../../controllers/pelatih/kejuaraan/getInputableKejuaraanController");
const {
  getPesertaByKejuaraan,
} = require("../../controllers/pelatih/kejuaraan/getPesertaByKejuaraanController");

/**
 * @swagger
 * /api/pelatih/kejuaraan/inputable:
 *   get:
 *     summary: Daftar kejuaraan yang masih bisa diinput hasil (sedang berlangsung atau H+1)
 *     tags: [Pelatih - Kejuaraan]
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
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       level:
 *                         type: string
 *                       location:
 *                         type: string
 *                       year:
 *                         type: integer
 *                       start_date:
 *                         type: string
 *                         format: date
 *                       end_date:
 *                         type: string
 *                         format: date
 *                       status_input:
 *                         type: string
 *                         enum: [berlangsung, toleransi, selesai]
 *                       jumlah_peserta:
 *                         type: integer
 *       500:
 *         description: Server error
 */
router.get("/kejuaraan/inputable", verifyToken, getInputableKejuaraan);

/**
 * @swagger
 * /api/pelatih/kejuaraan/{kejuaraanId}/peserta:
 *   get:
 *     summary: Daftar peserta dalam kejuaraan tertentu (untuk input hasil)
 *     tags: [Pelatih - Kejuaraan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: kejuaraanId
 *         required: true
 *         schema:
 *           type: integer
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
 *       - in: query
 *         name: kelas_id
 *         schema:
 *           type: integer
 *         description: Filter berdasarkan ID kelas_kejuaraan
 *     responses:
 *       200:
 *         description: Berhasil
 *       400:
 *         description: ID tidak valid
 *       404:
 *         description: Kejuaraan tidak ditemukan
 *       500:
 *         description: Server error
 */
router.get(
  "/kejuaraan/:kejuaraanId/peserta",
  verifyToken,
  getPesertaByKejuaraan,
);

/**
 * @swagger
 * /api/pelatih/kejuaraan/{kejuaraanId}/peserta/{pesertaId}:
 *   put:
 *     summary: Update hasil peserta kejuaraan (juara, harapan, peserta)
 *     description: |
 *       Endpoint ini digunakan untuk menginput atau mengubah hasil kejuaraan.
 *
 *       **Batasan waktu:**
 *       - Hanya dapat dilakukan selama kejuaraan berlangsung (`start_date` s.d `end_date`).
 *       - Masih diberikan toleransi **H+1** setelah `end_date` (satu hari setelah kejuaraan selesai).
 *
 *       **Catatan:**
 *       - Field `is_edited` akan otomatis menjadi `1` setiap kali diubah.
 *       - Catatan bersifat opsional.
 *     tags: [Pelatih - Kejuaraan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: kejuaraanId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID kejuaraan
 *         example: 1
 *       - in: path
 *         name: pesertaId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID peserta_kejuaraan
 *         example: 5
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hasil
 *             properties:
 *               hasil:
 *                 type: string
 *                 enum: [juara1, juara2, juara3, harapan1, harapan2, peserta]
 *                 example: "juara1"
 *               catatan:
 *                 type: string
 *                 nullable: true
 *                 example: "Bertanding dengan baik"
 *           example:
 *             hasil: "juara1"
 *             catatan: "Bertanding dengan baik"
 *     responses:
 *       200:
 *         description: Hasil peserta berhasil diperbarui
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
 *                     kelas_kejuaraan_id:
 *                       type: integer
 *                     user_id:
 *                       type: integer
 *                     belt_id:
 *                       type: integer
 *                     hasil:
 *                       type: string
 *                     catatan:
 *                       type: string
 *                       nullable: true
 *                     is_edited:
 *                       type: boolean
 *       400:
 *         description: Validasi gagal (ID tidak valid, hasil tidak sesuai enum)
 *       403:
 *         description: Diluar batas waktu input (belum dimulai atau sudah melewati H+1)
 *       404:
 *         description: Kejuaraan atau peserta tidak ditemukan
 *       500:
 *         description: Server error
 */
router.put(
  "/kejuaraan/:kejuaraanId/peserta/:pesertaId",
  verifyToken,
  updateHasilPeserta,
);

module.exports = router;
