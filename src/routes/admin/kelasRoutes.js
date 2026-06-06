const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middlewares/authJwt");
const { authorizeRole } = require("../../middlewares/roleAdmin");

const {
  createKelas,
} = require("../../controllers/admin/kelas/createKelasController");

const {
  getAllKelas,
} = require("../../controllers/admin/kelas/getAllKelasController");

const {
  getKelasById,
} = require("../../controllers/admin/kelas/getKelasByIdController");

const {
  updateKelas,
} = require("../../controllers/admin/kelas/updateKelasController");

const {
  softDeleteKelas,
} = require("../../controllers/admin/kelas/softDeleteKelasController");

const {
  addMuridToKelas,
} = require("../../controllers/admin/kelas/addMuridtoKelasController");

const {
  bulkAddMuridToKelas,
} = require("../../controllers/admin/kelas/addMuridtoKelasBulkController");

const {
  softDeleteMuridFromKelas,
} = require("../../controllers/admin/kelas/softDeleteMuridController");

const {
  addPelatihToKelas,
} = require("../../controllers/admin/kelas/addPelatihtoKelasController");

const {
  bulkAddPelatihToKelas,
} = require("../../controllers/admin/kelas/addPelatihtoKelasBulkController");

const {
  softDeletePelatihFromKelas,
} = require("../../controllers/admin/kelas/softDeletePelatihContoller");

const {
  bulkSoftDeletePelatihFromKelas,
} = require("../../controllers/admin/kelas/softDeletePelatihBulkController");

const {
  bulkSoftDeleteMuridFromKelas,
} = require("../../controllers/admin/kelas/softDeleteMuridBulkController");

/**
 * @swagger
 * /api/admin/kelas/createKelas:
 *   post:
 *     summary: Tambah kelas baru
 *     tags: [Admin - Kelas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nama
 *             properties:
 *               nama:
 *                 type: string
 *                 description: Nama kelas (unik)
 *                 example: "Kelas Taekwondo Pemula"
 *               deskripsi:
 *                 type: string
 *                 description: Deskripsi kelas
 *                 example: "Kelas untuk pemula usia 7-12 tahun"
 *               status:
 *                 type: string
 *                 enum: [aktif, nonaktif]
 *                 default: aktif
 *                 description: Status kelas
 *     responses:
 *       201:
 *         description: Kelas berhasil ditambahkan
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
 *                     nama:
 *                       type: string
 *                     deskripsi:
 *                       type: string
 *                       nullable: true
 *                     status:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validasi gagal (nama kosong, status salah)
 *       401:
 *         description: Token tidak valid
 *       403:
 *         description: Akses ditolak (bukan admin)
 *       409:
 *         description: Nama kelas sudah digunakan
 *       500:
 *         description: Kesalahan server
 */
router.post("/kelas/createKelas", createKelas);

/**
 * @swagger
 * /api/admin/kelas/getallkelas:
 *   get:
 *     summary: Get all kelas (with pagination, search, filter status, and summary)
 *     tags: [Admin - Kelas]
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
 *         description: Cari berdasarkan nama atau deskripsi
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [aktif, nonaktif] }
 *     responses:
 *       200:
 *         description: Berhasil mengambil data kelas
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
 *                     total_kelas:
 *                       type: integer
 *                     total_kelas_aktif:
 *                       type: string
 *                     total_kelas_nonaktif:
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
 *                       nama:
 *                         type: string
 *                       deskripsi:
 *                         type: string
 *                       status:
 *                         type: string
 *       401:
 *         description: Token tidak valid
 *       403:
 *         description: Akses ditolak (bukan admin)
 *       500:
 *         description: Kesalahan server
 */
router.get("/kelas/getallkelas", getAllKelas);

/**
 * @swagger
 * /api/admin/kelas/getkelasbyid/{id}:
 *   get:
 *     summary: Get detail kelas by ID
 *     tags: [Admin - Kelas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Berhasil mengambil detail kelas
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
 *                     nama:
 *                       type: string
 *                     deskripsi:
 *                       type: string
 *                     status:
 *                       type: string
 *       400:
 *         description: ID kelas tidak valid
 *       401:
 *         description: Token tidak valid
 *       403:
 *         description: Akses ditolak
 *       404:
 *         description: Kelas tidak ditemukan
 *       500:
 *         description: Kesalahan server
 */
router.get("/kelas/getkelasbyid/:id", getKelasById);

/**
 * @swagger
 * /api/admin/kelas/updatekelas/{id}:
 *   patch:
 *     summary: Update kelas (partial update)
 *     tags: [Admin - Kelas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID kelas
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nama:
 *                 type: string
 *                 description: Nama kelas (unik)
 *                 example: "Kelas Taekwondo Pemula Updated"
 *               deskripsi:
 *                 type: string
 *                 description: Deskripsi kelas (bisa diisi null atau string kosong)
 *                 example: "Kelas untuk pemula usia 8-13 tahun"
 *               status:
 *                 type: string
 *                 enum: [aktif, nonaktif]
 *                 description: Status kelas
 *                 example: "nonaktif"
 *     responses:
 *       200:
 *         description: Kelas berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Kelas berhasil diperbarui"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nama:
 *                       type: string
 *                     deskripsi:
 *                       type: string
 *                       nullable: true
 *                     status:
 *                       type: string
 *       400:
 *         description: Validasi gagal (ID tidak valid, tidak ada field yang dikirim, status salah)
 *       401:
 *         description: Token tidak valid atau tidak ditemukan
 *       403:
 *         description: Akses ditolak (bukan admin)
 *       404:
 *         description: Kelas tidak ditemukan
 *       409:
 *         description: Nama kelas sudah digunakan oleh kelas lain
 *       500:
 *         description: Kesalahan server
 */
router.patch("/kelas/updatekelas/:id", updateKelas);

/**
 * @swagger
 * /api/admin/kelas/softdeletekelas/{id}:
 *   patch:
 *     summary: Soft delete kelas (ubah status menjadi nonaktif)
 *     tags: [Admin - Kelas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID kelas yang akan dinonaktifkan
 *         example: 1
 *     responses:
 *       200:
 *         description: Kelas berhasil dinonaktifkan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Kelas berhasil dinonaktifkan (soft delete)"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nama:
 *                       type: string
 *                     deskripsi:
 *                       type: string
 *                       nullable: true
 *                     status:
 *                       type: string
 *                       example: "nonaktif"
 *       400:
 *         description: ID tidak valid atau kelas sudah nonaktif
 *       401:
 *         description: Token tidak valid atau tidak ditemukan
 *       403:
 *         description: Akses ditolak (bukan admin)
 *       404:
 *         description: Kelas tidak ditemukan
 *       500:
 *         description: Kesalahan server
 */
router.patch("/kelas/softdeletekelas/:id", softDeleteKelas);

/**
 * @swagger
 * /api/admin/kelas/addMurid:
 *   post:
 *     summary: Tambah murid ke kelas (enroll)
 *     tags: [Admin - Kelas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - kelas_id
 *               - user_id
 *             properties:
 *               kelas_id:
 *                 type: integer
 *                 description: ID kelas (harus aktif)
 *                 example: 1
 *               user_id:
 *                 type: integer
 *                 description: ID user murid (harus active)
 *                 example: 1
 *     responses:
 *       201:
 *         description: Murid berhasil ditambahkan ke kelas
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
 *                     kelas_id:
 *                       type: integer
 *                     user_id:
 *                       type: integer
 *                     tanggal_bergabung:
 *                       type: string
 *                       format: date
 *                     status:
 *                       type: string
 *                     kelas_nama:
 *                       type: string
 *                     murid_nama:
 *                       type: string
 *       400:
 *         description: Input tidak valid (kelas_id atau user_id kosong/tidak valid)
 *       401:
 *         description: Token tidak valid
 *       403:
 *         description: Akses ditolak (bukan admin)
 *       404:
 *         description: Kelas tidak ditemukan/aktif, atau murid tidak ditemukan/aktif
 *       409:
 *         description: Murid sudah terdaftar di kelas ini (status aktif)
 *       500:
 *         description: Kesalahan server
 */
router.post("/kelas/addMurid", addMuridToKelas);

/**
 * @swagger
 * /api/admin/kelas/bulkaddmurid:
 *   post:
 *     summary: Tambah banyak murid ke satu kelas (bulk enroll)
 *     tags: [Admin - Kelas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - kelas_id
 *               - user_ids
 *             properties:
 *               kelas_id:
 *                 type: integer
 *                 description: ID kelas (status harus aktif)
 *                 example: 1
 *               user_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array ID murid (status harus active)
 *                 example: [1, 4, 7]
 *     responses:
 *       200:
 *         description: Berhasil menambahkan sebagian atau seluruh murid
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
 *                           kelas_id:
 *                             type: integer
 *                           user_id:
 *                             type: integer
 *                           tanggal_bergabung:
 *                             type: string
 *                             format: date
 *                           status:
 *                             type: string
 *                           kelas_nama:
 *                             type: string
 *                           murid_nama:
 *                             type: string
 *                     failed:
 *                       type: object
 *                       properties:
 *                         invalid_murid:
 *                           type: array
 *                           items:
 *                             type: integer
 *                         already_active:
 *                           type: array
 *                           items:
 *                             type: integer
 *       400:
 *         description: Input tidak valid (kelas_id kosong, user_ids bukan array, atau duplikat)
 *       401:
 *         description: Token tidak valid
 *       403:
 *         description: Akses ditolak (bukan admin)
 *       404:
 *         description: Kelas tidak ditemukan atau tidak aktif
 *       409:
 *         description: Tidak ada murid yang bisa ditambahkan (semua sudah aktif)
 *       500:
 *         description: Kesalahan server
 */
router.post("/kelas/bulkaddmurid", bulkAddMuridToKelas);

/**
 * @swagger
 * /api/admin/kelas/softdeletemurid:
 *   patch:
 *     summary: Soft delete keanggotaan murid dari kelas (nonaktifkan)
 *     tags: [Admin - Kelas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - kelas_id
 *               - user_id
 *             properties:
 *               kelas_id:
 *                 type: integer
 *                 description: ID kelas
 *                 example: 1
 *               user_id:
 *                 type: integer
 *                 description: ID murid
 *                 example: 4
 *     responses:
 *       200:
 *         description: Keanggotaan berhasil dinonaktifkan
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
 *                     kelas_id:
 *                       type: integer
 *                     user_id:
 *                       type: integer
 *                     tanggal_bergabung:
 *                       type: string
 *                       format: date
 *                     status:
 *                       type: string
 *                     kelas_nama:
 *                       type: string
 *                     murid_nama:
 *                       type: string
 *       400:
 *         description: Input tidak valid (kelas_id atau user_id kosong/tidak valid)
 *       401:
 *         description: Token tidak valid
 *       403:
 *         description: Akses ditolak (bukan admin)
 *       404:
 *         description: Keanggotaan aktif tidak ditemukan
 *       500:
 *         description: Kesalahan server
 */
router.patch("/kelas/softdeletemurid", softDeleteMuridFromKelas);

/**
 * @swagger
 * /api/admin/kelas/softdeletemurid/bulk:
 *   patch:
 *     summary: Soft delete (nonaktifkan) banyak murid dari kelas
 *     tags: [Admin - Kelas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - kelas_id
 *               - user_ids
 *             properties:
 *               kelas_id:
 *                 type: integer
 *                 example: 1
 *               user_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [4,7,10]
 *     responses:
 *       200:
 *         description: Berhasil menonaktifkan sebagian atau seluruh keanggotaan
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
 *                     failed:
 *                       type: object
 *                       properties:
 *                         not_active_or_not_found:
 *                           type: array
 *                           items:
 *                             type: integer
 *       400:
 *         description: Input tidak valid (kelas_id kosong, user_ids bukan array, dll)
 *       404:
 *         description: Tidak ada keanggotaan aktif yang ditemukan
 *       500:
 *         description: Kesalahan server
 */
router.patch("/kelas/softdeletemurid/bulk", bulkSoftDeleteMuridFromKelas);

/**
 * @swagger
 * /api/admin/kelas/addpelatih:
 *   post:
 *     summary: Tugaskan satu pelatih ke kelas (support reaktivasi)
 *     tags: [Admin - Kelas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - kelas_id
 *               - user_id
 *             properties:
 *               kelas_id:
 *                 type: integer
 *                 description: ID kelas (status harus aktif)
 *                 example: 1
 *               user_id:
 *                 type: integer
 *                 description: ID user (pelatih, status aktif)
 *                 example: 2
 *     responses:
 *       200:
 *         description: Berhasil menugaskan atau mengaktifkan kembali pelatih
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
 *                     kelas_id:
 *                       type: integer
 *                     user_id:
 *                       type: integer
 *                     tanggal_bergabung:
 *                       type: string
 *                       format: date
 *                     status:
 *                       type: string
 *                       enum: [aktif, nonaktif]
 *                     kelas_nama:
 *                       type: string
 *                     pelatih_nama:
 *                       type: string
 *       400:
 *         description: Input tidak valid
 *       404:
 *         description: Kelas tidak aktif atau pelatih tidak ditemukan
 *       500:
 *         description: Kesalahan server
 */
router.post("/kelas/addpelatih", addPelatihToKelas);

/**
 * @swagger
 * /api/admin/kelas/bulkaddpelatih:
 *   post:
 *     summary: Tugaskan banyak pelatih ke satu kelas (support reaktivasi)
 *     tags: [Admin - Kelas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - kelas_id
 *               - user_ids
 *             properties:
 *               kelas_id:
 *                 type: integer
 *                 example: 1
 *               user_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [2,5,8]
 *     responses:
 *       200:
 *         description: Berhasil menugaskan sebagian atau seluruh pelatih
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
 *                     failed:
 *                       type: object
 *                       properties:
 *                         invalid_pelatih:
 *                           type: array
 *                           items:
 *                             type: integer
 *                         failed_to_activate:
 *                           type: array
 *                           items:
 *                             type: integer
 *       400:
 *         description: Input tidak valid
 *       404:
 *         description: Kelas tidak ditemukan/tidak aktif
 *       500:
 *         description: Kesalahan server
 */
router.post("/kelas/bulkaddpelatih", bulkAddPelatihToKelas);

/**
 * @swagger
 * /api/admin/kelas/softdeletepelatih:
 *   patch:
 *     summary: Soft delete (nonaktifkan) satu pelatih dari kelas
 *     tags: [Admin - Kelas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - kelas_id
 *               - user_id
 *             properties:
 *               kelas_id:
 *                 type: integer
 *                 example: 1
 *               user_id:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Pelatih berhasil dinonaktifkan dari kelas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Input tidak valid
 *       404:
 *         description: Pelatih tidak ditemukan atau sudah nonaktif
 *       500:
 *         description: Kesalahan server
 */
router.patch("/kelas/softdeletepelatih", softDeletePelatihFromKelas);

/**
 * @swagger
 * /api/admin/kelas/softdelete/bulk:
 *   patch:
 *     summary: Soft delete (nonaktifkan) banyak pelatih dari kelas
 *     tags: [Admin - Kelas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - kelas_id
 *               - user_ids
 *             properties:
 *               kelas_id:
 *                 type: integer
 *                 example: 1
 *               user_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [2,5,8]
 *     responses:
 *       200:
 *         description: Berhasil menonaktifkan sebagian pelatih
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
 *                     failed:
 *                       type: object
 *                       properties:
 *                         not_active_or_not_found:
 *                           type: array
 *                           items:
 *                             type: integer
 *       400:
 *         description: Input tidak valid
 *       404:
 *         description: Tidak ada pelatih aktif yang ditemukan
 *       500:
 *         description: Kesalahan server
 */
router.patch("/kelas/softdelete/bulk", bulkSoftDeletePelatihFromKelas);

module.exports = router;
