const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middlewares/authJwt");
const { authorizeRole } = require("../../middlewares/roleAdmin");

const {
  getAllAdmin,
} = require("../../controllers/admin/admin/getAllAdminController");

const {
  getAdminById,
} = require("../../controllers/admin/admin/getAdminByIdController");

const {
  softDeleteAdmin,
} = require("../../controllers/admin/admin/softDeleteAdminController");

/**
 * @swagger
 * /api/admin/get/allAdmin:
 *   get:
 *     summary: Get all admin (with pagination, search, and summary)
 *     tags: [Admin - Manajemen Admin]
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
 *         description: Cari berdasarkan name, email, atau phone
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter status admin
 *     responses:
 *       200:
 *         description: Berhasil mengambil data admin
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
 *                     total_admin:
 *                       type: integer
 *                     total_admin_active:
 *                       type: string
 *                     total_admin_inactive:
 *                       type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total_data:
 *                       type: integer
 *                     total_page:
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
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       phone:
 *                         type: string
 *                       foto:
 *                         type: string
 *                         nullable: true
 *                       jenis_kelamin:
 *                         type: string
 *                         nullable: true
 *                       alamat:
 *                         type: string
 *                         nullable: true
 *                       tanggal_lahir:
 *                         type: string
 *                         format: date
 *                       status:
 *                         type: string
 *                       tanggal_bergabung:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Token tidak valid atau tidak ditemukan
 *       403:
 *         description: Akses ditolak (bukan admin)
 *       500:
 *         description: Kesalahan server
 */
router.get("/get/allAdmin", getAllAdmin);

/**
 * @swagger
 * /api/admin/get/admin/{id}:
 *   get:
 *     summary: Get admin detail by ID
 *     tags: [Admin - Manajemen Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID admin
 *         example: 3
 *     responses:
 *       200:
 *         description: Berhasil mengambil detail admin
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
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     foto:
 *                       type: string
 *                       nullable: true
 *                     jenis_kelamin:
 *                       type: string
 *                       nullable: true
 *                     alamat:
 *                       type: string
 *                       nullable: true
 *                     tanggal_lahir:
 *                       type: string
 *                       format: date
 *                     status:
 *                       type: string
 *                     tanggal_bergabung:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: ID admin tidak valid
 *       401:
 *         description: Token tidak valid atau tidak ditemukan
 *       403:
 *         description: Akses ditolak (bukan admin)
 *       404:
 *         description: Admin tidak ditemukan
 *       500:
 *         description: Kesalahan server
 */
router.get("/get/admin/:id", getAdminById);

/**
 * @swagger
 * /api/admin/softDelete/admin/{id}:
 *   patch:
 *     summary: Soft delete admin (ubah status menjadi inactive)
 *     tags: [Admin - Manajemen Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID admin yang akan dinonaktifkan
 *         example: 3
 *     responses:
 *       200:
 *         description: Admin berhasil dinonaktifkan
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
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     status:
 *                       type: string
 *       400:
 *         description: ID tidak valid atau admin sudah inactive
 *       401:
 *         description: Token tidak valid atau tidak ditemukan
 *       403:
 *         description: Akses ditolak (bukan admin)
 *       404:
 *         description: Admin tidak ditemukan
 *       500:
 *         description: Kesalahan server
 */
router.patch("/softDelete/admin/:id", softDeleteAdmin);

module.exports = router;
