const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middlewares/authJwt");
const { authorizeRole } = require("../../middlewares/roleAdmin");

// Controller untuk sertifikasi pelatih
const {
  addSertifikasiPelatih,
} = require("../../controllers/admin/pelatih/addSertifikasiPelatihController");
const {
  deleteSertifikasiPelatih,
} = require("../../controllers/admin/pelatih/deleteSertifikasiPelatihController");

/**
 * @swagger
 * tags:
 *   - name: Pelatih - Sertifikasi
 *     description: Kelola sertifikasi pelatih
 */

// ── Sertifikasi Pelatih ────────────────────────

/**
 * @swagger
 * /api/admin/pelatih/{pelatihId}/sertifikasi:
 *   post:
 *     summary: Tambah sertifikasi untuk pelatih
 *     tags: [Pelatih - Sertifikasi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pelatihId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID user (pelatih)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nama_sertifikasi
 *             properties:
 *               nama_sertifikasi:
 *                 type: string
 *                 example: "Sertifikasi Pelatih Nasional"
 *     responses:
 *       201:
 *         description: Sertifikasi berhasil ditambahkan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Sertifikasi berhasil ditambahkan"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     pelatih_id:
 *                       type: integer
 *                     nama_sertifikasi:
 *                       type: string
 *       400:
 *         description: Input tidak valid (ID pelatih salah atau nama sertifikasi kosong)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 *         description: Pelatih tidak ditemukan
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
router.post("/pelatih/:pelatihId/sertifikasi", addSertifikasiPelatih);

/**
 * @swagger
 * /api/admin/pelatih/{pelatihId}/sertifikasi/{sertifikasiId}:
 *   delete:
 *     summary: Hapus sertifikasi pelatih berdasarkan ID sertifikasi
 *     tags: [Pelatih - Sertifikasi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pelatihId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID user (pelatih)
 *       - in: path
 *         name: sertifikasiId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID sertifikasi (dari tabel sertifikasi_pelatih)
 *     responses:
 *       200:
 *         description: Sertifikasi berhasil dihapus
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Sertifikasi berhasil dihapus"
 *       400:
 *         description: ID tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 *         description: Pelatih atau sertifikasi tidak ditemukan
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
router.delete(
  "/pelatih/:pelatihId/sertifikasi/:sertifikasiId",
  deleteSertifikasiPelatih,
);

module.exports = router;
