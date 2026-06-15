const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middlewares/authJwt");
const { authorizeRole } = require("../../middlewares/roleAdmin");

const {
  addKelasKejuaraan,
} = require("../../controllers/admin/kejuaraan/addKelasKejuaraanController");
const {
  getAllKejuaraan,
} = require("../../controllers/admin/kejuaraan/getAllKejuaraanController");
const {
  getKejuaraanById,
} = require("../../controllers/admin/kejuaraan/getKejuaraanByIdController");
const {
  createKejuaraan,
} = require("../../controllers/admin/kejuaraan/createKejuaraanController");
const {
  updateKejuaraan,
} = require("../../controllers/admin/kejuaraan/updateKelasKejuaraanController");
const {
  createKelasKyorugi,
} = require("../../controllers/admin/kejuaraan/createKelasKyorugiController");
const {
  getKelasKyorugiById,
} = require("../../controllers/admin/kejuaraan/getKelasKyorugiByIdController");
const {
  getAllKelasKyorugi,
} = require("../../controllers/admin/kejuaraan/getAllKelasKyorugiFilterContoller");
const {
  getAllKelasKyorugiSimple,
} = require("../../controllers/admin/kejuaraan/getAllKelasKyorugiController");
const {
  updateKelasKyorugi,
} = require("../../controllers/admin/kejuaraan/updateKelasKyorugiController");
const {
  deleteKelasKyorugi,
} = require("../../controllers/admin/kejuaraan/deleteKelasKyorugiController");
const {
  deleteKejuaraan,
} = require("../../controllers/admin/kejuaraan/deleteKejuaraanController");
const {
  getAllKategoriUsia,
} = require("../../controllers/admin/kejuaraan/getAllKategoriUsiaController");
const {
  getAllLevelKelas,
} = require("../../controllers/admin/kejuaraan/getAllLevelKelasController");
const {
  createKelasPoomsae,
} = require("../../controllers/admin/kejuaraan/createKelasPoomsaeController");
const {
  getAllKelasPoomsae,
} = require("../../controllers/admin/kejuaraan/getAllKelasPoomsaeController");
const {
  getAllPoomsaeFormat,
} = require("../../controllers/admin/kejuaraan/getAllPoomsaeFormatController");
const {
  getAllPoomsaeJurus,
} = require("../../controllers/admin/kejuaraan/getAllPoomsaeJurusController");
const {
  getKelasPoomsaeById,
} = require("../../controllers/admin/kejuaraan/getKelasPoomsaeByIdController");
const {
  updateKelasPoomsae,
} = require("../../controllers/admin/kejuaraan/updateKelasPoomsaeController");
const {
  deleteKelasPoomsae,
} = require("../../controllers/admin/kejuaraan/deleteKelasPoomsaeController");

/**
 * @swagger
 * /api/admin/kategori-usia:
 *   get:
 *     summary: Ambil semua daftar kategori usia (Pra-Cadet, Cadet, Junior, Senior)
 *     tags: [Admin - Kejuaraan]
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get("/kategori-usia", verifyToken, getAllKategoriUsia);

/**
 * @swagger
 * /api/admin/level-kelas:
 *   get:
 *     summary: Ambil semua daftar level kelas (festival, pemula, prestasi)
 *     tags: [Admin - Kejuaraan]
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get("/level-kelas", verifyToken, getAllLevelKelas);

/**
 * @swagger
 * /api/admin/poomsae-format:
 *   get:
 *     summary: Ambil semua daftar format pertandingan poomsae
 *     description: |
 *       Data master untuk dropdown format pertandingan poomsae.
 *       Contoh format: tunggal, pasangan, beregu putra, beregu putri, freestyle.
 *     tags: [Admin - Kejuaraan]
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
 *             example:
 *               success: true
 *               message: "Berhasil mengambil data format poomsae"
 *               data:
 *                 - id: 1
 *                   name: "tunggal"
 *                 - id: 2
 *                   name: "pasangan"
 *                 - id: 3
 *                   name: "beregu putra"
 *                 - id: 4
 *                   name: "freestyle"
 *                 - id: 5
 *                   name: "beregu putri"
 *       401:
 *         description: Token tidak valid
 *       403:
 *         description: Akses ditolak
 *       500:
 *         description: Server error
 */
router.get("/poomsae-format", verifyToken, getAllPoomsaeFormat);

/**
 * @swagger
 * /api/admin/poomsae-jurus:
 *   get:
 *     summary: Ambil semua daftar jurus poomsae
 *     description: |
 *       Data master untuk dropdown jurus poomsae.
 *       Contoh: Taegeuk Iljang, Koryo, Freestyle, dll.
 *     tags: [Admin - Kejuaraan]
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
 *             example:
 *               success: true
 *               message: "Berhasil mengambil data jurus poomsae"
 *               data:
 *                 - id: 1
 *                   name: "Taegeuk Iljang"
 *                 - id: 2
 *                   name: "Taegeuk Ee Jang"
 *                 - id: 3
 *                   name: "Koryo"
 *                 - id: 4
 *                   name: "Freestyle"
 *       401:
 *         description: Token tidak valid
 *       403:
 *         description: Akses ditolak
 *       500:
 *         description: Server error
 */
router.get("/poomsae-jurus", verifyToken, getAllPoomsaeJurus);

/**
 * @swagger
 * /api/admin/kejuaraan/create:
 *   post:
 *     summary: Create a new competition (kejuaraan)
 *     tags: [Admin - Kejuaraan]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - level
 *               - start_date
 *               - end_date
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Kejuaraan Kota 1"
 *               level:
 *                 type: string
 *                 enum: [kota, provinsi, nasional, internasional]
 *                 example: "kota"
 *               location:
 *                 type: string
 *                 example: "GOR Kota Salatiga"
 *               start_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-06-10"
 *               end_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-06-12"
 *     responses:
 *       201:
 *         description: Kejuaraan berhasil dibuat
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
 *                     level:
 *                       type: string
 *                     location:
 *                       type: string
 *                       nullable: true
 *                     year:
 *                       type: integer
 *                     start_date:
 *                       type: string
 *                       format: date
 *                     end_date:
 *                       type: string
 *                       format: date
 *       400:
 *         description: Validasi gagal (input tidak lengkap, format salah, atau tanggal tidak valid)
 *       401:
 *         description: Token tidak valid atau tidak ditemukan
 *       403:
 *         description: Akses ditolak (bukan admin)
 *       409:
 *         description: Duplikasi data - kejuaraan dengan nama dan tahun yang sama sudah ada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Tidak dapat membuat kejuaraan karena bentrok dengan kejuaraan \"Kejuaraan Kota 2\" pada tanggal 2026-06-11 s.d 2026-06-13 di lokasi yang sama."
 *       500:
 *         description: Kesalahan server
 */
router.post("/kejuaraan/create", verifyToken, createKejuaraan);

/**
 * @swagger
 * /api/admin/kejuaraan/getall:
 *   get:
 *     summary: Get all championships (paginated, with search & filters)
 *     tags: [Admin - Kejuaraan]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Cari berdasarkan nama atau lokasi
 *         example: "Kota"
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [kota, provinsi, nasional, internasional]
 *         description: Filter tingkat kejuaraan
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [akan_datang, berlangsung, selesai]
 *         description: Filter status kejuaraan
 *     responses:
 *       200:
 *         description: Berhasil mengambil data kejuaraan
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
 *                       level:
 *                         type: string
 *                       location:
 *                         type: string
 *                         nullable: true
 *                       start_date:
 *                         type: string
 *                         format: date
 *                       end_date:
 *                         type: string
 *                         format: date
 *                       status:
 *                         type: string
 *                         enum: [akan_datang, berlangsung, selesai]
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
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total_championship:
 *                           type: integer
 *                         akan_datang:
 *                           type: integer
 *                         berlangsung:
 *                           type: integer
 *                         selesai:
 *                           type: integer
 *             example:
 *               success: true
 *               message: "Berhasil mengambil data kejuaraan"
 *               data:
 *                 - id: 1
 *                   name: "Kejuaraan Kota 1"
 *                   level: "kota"
 *                   location: "GOR Kota Salatiga"
 *                   start_date: "2026-06-10"
 *                   end_date: "2026-06-12"
 *                   status: "akan_datang"
 *               meta:
 *                 pagination:
 *                   current_page: 1
 *                   per_page: 10
 *                   total_page: 1
 *                   total_data: 1
 *                   has_next: false
 *                   has_prev: false
 *                 summary:
 *                   total_championship: 1
 *                   akan_datang: 1
 *                   berlangsung: 0
 *                   selesai: 0
 *       400:
 *         description: Parameter tidak valid (level atau status salah)
 *       401:
 *         description: Token tidak valid atau tidak ditemukan
 *       403:
 *         description: Akses ditolak (bukan admin)
 *       500:
 *         description: Kesalahan server
 */
router.get("/kejuaraan/getall", verifyToken, getAllKejuaraan);

/**
 * @swagger
 * /api/admin/kejuaraan/update/{id}:
 *   put:
 *     summary: Update data kejuaraan
 *     tags: [Admin - Kejuaraan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID kejuaraan yang akan diupdate
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nama kejuaraan (opsional)
 *                 example: "Kejuaraan Kota 1 Update"
 *               level:
 *                 type: string
 *                 enum: [kota, provinsi, nasional, internasional]
 *                 description: Level kejuaraan (opsional)
 *               location:
 *                 type: string
 *                 description: Lokasi (opsional)
 *               start_date:
 *                 type: string
 *                 format: date
 *                 description: Tanggal mulai baru (opsional)
 *               end_date:
 *                 type: string
 *                 format: date
 *                 description: Tanggal selesai baru (opsional)
 *           example:
 *             name: "Kejuaraan Kota 1 Revisi"
 *             start_date: "2026-07-01"
 *             end_date: "2026-07-03"
 *             location: "GOR Baru"
 *     responses:
 *       200:
 *         description: Kejuaraan berhasil diperbarui
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
 *                     level:
 *                       type: string
 *                     location:
 *                       type: string
 *                       nullable: true
 *                     year:
 *                       type: integer
 *                     start_date:
 *                       type: string
 *                       format: date
 *                     end_date:
 *                       type: string
 *                       format: date
 *       400:
 *         description: Validasi gagal (input tidak valid, tanggal sudah lewat, atau end_date < start_date)
 *       401:
 *         description: Token tidak valid
 *       403:
 *         description: Akses ditolak
 *       404:
 *         description: Kejuaraan tidak ditemukan
 *       409:
 *         description: Konflik - bentrok tanggal dan lokasi dengan kejuaraan lain
 *       500:
 *         description: Kesalahan server
 */
router.put("/kejuaraan/update/:id", verifyToken, updateKejuaraan);

/**
 * @swagger
 * /api/admin/kejuaraan/{id}:
 *   get:
 *     summary: Get detail kejuaraan by ID beserta daftar kelas pertandingan
 *     tags: [Admin - Kejuaraan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID kejuaraan
 *         example: 1
 *     responses:
 *       200:
 *         description: Detail kejuaraan berhasil diambil
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
 *                     level:
 *                       type: string
 *                       enum: [kota, provinsi, nasional, internasional]
 *                     location:
 *                       type: string
 *                       nullable: true
 *                     year:
 *                       type: integer
 *                     start_date:
 *                       type: string
 *                       format: date
 *                     end_date:
 *                       type: string
 *                       format: date
 *                     kelas_pertandingan:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             description: ID dari kelas_kejuaraan (relation)
 *                           tipe:
 *                             type: string
 *                             enum: [kyorugi, poomsae]
 *                           kelas_id:
 *                             type: integer
 *                             description: ID dari tabel kelas_kyorugi atau kelas_poomsae
 *                           detail:
 *                             type: object
 *                             oneOf:
 *                               - $ref: '#/components/schemas/KelasKyorugiDetail'
 *                               - $ref: '#/components/schemas/KelasPoomsaeDetail'
 *             example:
 *               message: "Berhasil mengambil detail kejuaraan"
 *               data:
 *                 id: 1
 *                 name: "Kejuaraan Taekwondo Antar Pelajar 2026"
 *                 level: "provinsi"
 *                 location: "GOR Kota Bandung"
 *                 year: 2026
 *                 start_date: "2026-06-10"
 *                 end_date: "2026-06-12"
 *                 kelas_pertandingan:
 *                   - id: 1
 *                     tipe: "kyorugi"
 *                     kelas_id: 5
 *                     detail:
 *                       gender: "putra"
 *                       label: "under-48"
 *                       batas_berat: 48
 *                       kategori_usia:
 *                         id: 2
 *                         nama: "Cadet"
 *                         min_age: 12
 *                         max_age: 14
 *                       level_kelas:
 *                         id: 2
 *                         nama: "pemula"
 *                   - id: 2
 *                     tipe: "poomsae"
 *                     kelas_id: 2
 *                     detail:
 *                       gender: "putri"
 *                       jurus: "Taeguk 3"
 *                       format: "tunggal"
 *                       kategori_usia:
 *                         id: 2
 *                         nama: "Cadet"
 *                         min_age: 12
 *                         max_age: 14
 *                       level_kelas:
 *                         id: 1
 *                         nama: "festival"
 *       400:
 *         description: ID kejuaraan tidak valid
 *       401:
 *         description: Token tidak valid atau tidak ditemukan
 *       403:
 *         description: Akses ditolak (bukan admin)
 *       404:
 *         description: Kejuaraan tidak ditemukan
 *       500:
 *         description: Kesalahan server
 *
 * components:
 *   schemas:
 *     KelasKyorugiDetail:
 *       type: object
 *       properties:
 *         gender:
 *           type: string
 *         label:
 *           type: string
 *         batas_berat:
 *           type: number
 *         kategori_usia:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             nama:
 *               type: string
 *             min_age:
 *               type: integer
 *             max_age:
 *               type: integer
 *         level_kelas:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             nama:
 *               type: string
 *     KelasPoomsaeDetail:
 *       type: object
 *       properties:
 *         gender:
 *           type: string
 *         jurus:
 *           type: string
 *         format:
 *           type: string
 *         kategori_usia:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             nama:
 *               type: string
 *             min_age:
 *               type: integer
 *             max_age:
 *               type: integer
 *         level_kelas:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             nama:
 *               type: string
 */
router.get("/kejuaraan/:id", verifyToken, getKejuaraanById);

/**
 * @swagger
 * /api/admin/kejuaraan/{id}:
 *   delete:
 *     summary: Hapus kejuaraan (hanya untuk kejuaraan yang akan datang dan belum memiliki peserta)
 *     tags: [Admin - Kejuaraan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Kejuaraan berhasil dihapus
 *       400:
 *         description: ID kejuaraan tidak valid
 *       401:
 *         description: Token tidak valid atau tidak ditemukan
 *       403:
 *         description: Akses ditolak (bukan admin)
 *       404:
 *         description: Kejuaraan tidak ditemukan
 *       409:
 *         description: |
 *           Kejuaraan tidak dapat dihapus karena salah satu alasan:
 *           - Kejuaraan sedang berlangsung
 *           - Kejuaraan sudah selesai
 *           - Kejuaraan akan datang tetapi sudah memiliki peserta
 *           - Kejuaraan masih memiliki kelas pertandingan
 *       500:
 *         description: Kesalahan server
 */
router.delete("/kejuaraan/:id", verifyToken, deleteKejuaraan);

/**
 * @swagger
 * /api/admin/kejuaraan/{kejuaraanId}/kelas:
 *   post:
 *     summary: Tambahkan kelas pertandingan ke kejuaraan (hubungkan ke kelas_kyorugi atau kelas_poomsae)
 *     tags: [Admin - Kejuaraan]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipe
 *               - kelas_id
 *             properties:
 *               tipe:
 *                 type: string
 *                 enum: [kyorugi, poomsae]
 *                 description: Jenis cabang lomba
 *                 example: "kyorugi"
 *               kelas_id:
 *                 type: integer
 *                 description: ID dari tabel kelas_kyorugi atau kelas_poomsae sesuai tipe
 *                 example: 5
 *           examples:
 *             kyorugi:
 *               summary: Menambahkan kelas kyorugi
 *               value:
 *                 tipe: "kyorugi"
 *                 kelas_id: 5
 *             poomsae:
 *               summary: Menambahkan kelas poomsae
 *               value:
 *                 tipe: "poomsae"
 *                 kelas_id: 2
 *     responses:
 *       201:
 *         description: Kelas kejuaraan berhasil ditambahkan
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
 *                     kejuaraan_id:
 *                       type: integer
 *                     tipe:
 *                       type: string
 *                     kelas_id:
 *                       type: integer
 *             example:
 *               message: "Kelas kejuaraan berhasil ditambahkan"
 *               data:
 *                 id: 5
 *                 kejuaraan_id: 1
 *                 tipe: "kyorugi"
 *                 kelas_id: 5
 *       400:
 *         description: Validasi gagal (tipe invalid, kelas_id tidak ditemukan, atau duplikat)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               tipeSalah:
 *                 value:
 *                   message: "Tipe harus kyorugi atau poomsae"
 *               kelasTidakDitemukan:
 *                 value:
 *                   message: "kelas_id tidak ditemukan di tabel kelas_kyorugi"
 *               duplikat:
 *                 value:
 *                   message: "Kelas sudah terdaftar untuk kejuaraan ini"
 *       401:
 *         description: Token tidak valid atau tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Akses ditolak (bukan admin)
 *       404:
 *         description: Kejuaraan tidak ditemukan
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
router.post("/kejuaraan/:kejuaraanId/kelas", addKelasKejuaraan);

/**
 * @swagger
 * /api/admin/kelas-kyorugi:
 *   post:
 *     summary: Tambah kelas pertandingan Kyorugi (master data)
 *     tags: [Admin - Kejuaraan - Kelas Kyorugi]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - kategori_usia_id
 *               - level_kelas_id
 *               - gender
 *               - label
 *             properties:
 *               kategori_usia_id:
 *                 type: integer
 *                 description: ID kategori usia (1=Pra-Cadet, 2=Cadet, 3=Junior, 4=Senior)
 *                 example: 2
 *               level_kelas_id:
 *                 type: integer
 *                 description: ID level kelas (1=festival, 2=pemula, 3=prestasi)
 *                 example: 2
 *               gender:
 *                 type: string
 *                 enum: [putra, putri]
 *                 example: "putra"
 *               label:
 *                 type: string
 *                 description: Label kelas berat, harus mengandung angka (contoh under-42)
 *                 example: "under-42"
 *               batas_bawah:
 *                 type: number
 *                 description: Batas berat minimal (kg), opsional
 *                 example: 35
 *               batas_atas:
 *                 type: number
 *                 description: Batas berat maksimal (kg), opsional, tidak boleh melebihi angka di label
 *                 example: 42
 *     responses:
 *       201:
 *         description: Kelas kyorugi berhasil ditambahkan
 *       400:
 *         description: Validasi gagal
 *       409:
 *         description: Duplikasi data
 */
router.post("/kelas-kyorugi", createKelasKyorugi);

/**
 * @swagger
 * /api/admin/kelas-kyorugi:
 *   get:
 *     summary: Get all kelas kyorugi with pagination and filters
 *     tags: [Admin - Kejuaraan - Kelas Kyorugi]
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Cari berdasarkan label
 *         example: "under"
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [putra, putri]
 *         description: Filter gender
 *       - in: query
 *         name: kategori_usia_id
 *         schema:
 *           type: integer
 *         description: Filter berdasarkan ID kategori usia
 *         example: 2
 *       - in: query
 *         name: level_kelas_id
 *         schema:
 *           type: integer
 *         description: Filter berdasarkan ID level kelas
 *         example: 2
 *     responses:
 *       200:
 *         description: Berhasil mengambil data kelas kyorugi
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
 *                       gender:
 *                         type: string
 *                       label:
 *                         type: string
 *                       batas_bawah:
 *                         type: number
 *                         nullable: true
 *                       batas_atas:
 *                         type: number
 *                         nullable: true
 *                       kategori_usia:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           nama:
 *                             type: string
 *                             nullable: true
 *                       level_kelas:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           nama:
 *                             type: string
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
 *         description: Parameter tidak valid
 *       401:
 *         description: Token tidak valid
 *       403:
 *         description: Akses ditolak
 *       500:
 *         description: Kesalahan server
 */
router.get("/kelas-kyorugi", getAllKelasKyorugi);

/**
 * @swagger
 * /api/admin/kelas-kyorugi/simple:
 *   get:
 *     summary: Get all kelas kyorugi with pagination (no filters)
 *     tags: [Admin - Kejuaraan - Kelas Kyorugi]
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
 *     responses:
 *       200:
 *         description: Berhasil mengambil data
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
 *                       gender:
 *                         type: string
 *                       label:
 *                         type: string
 *                       batas_bawah:
 *                         type: number
 *                         nullable: true
 *                       batas_atas:
 *                         type: number
 *                         nullable: true
 *                       kategori_usia:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           nama:
 *                             type: string
 *                           min_age:
 *                             type: integer
 *                           max_age:
 *                             type: integer
 *                             nullable: true
 *                       level_kelas:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           nama:
 *                             type: string
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
 *         description: Parameter tidak valid
 *       401:
 *         description: Token tidak valid
 *       403:
 *         description: Akses ditolak (bukan admin)
 *       500:
 *         description: Kesalahan server
 */
router.get("/kelas-kyorugi/simple", getAllKelasKyorugiSimple);

/**
 * @swagger
 * /api/admin/kelas-kyorugi/{id}:
 *   get:
 *     summary: Get detail kelas kyorugi by ID
 *     tags: [Admin - Kejuaraan - Kelas Kyorugi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID kelas kyorugi
 *         example: 1
 *     responses:
 *       200:
 *         description: Detail kelas kyorugi berhasil diambil
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
 *                     gender:
 *                       type: string
 *                       enum: [putra, putri]
 *                     label:
 *                       type: string
 *                     batas_bawah:
 *                       type: number
 *                       nullable: true
 *                     batas_atas:
 *                       type: number
 *                       nullable: true
 *                     kategori_usia:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         nama:
 *                           type: string
 *                         min_age:
 *                           type: integer
 *                         max_age:
 *                           type: integer
 *                           nullable: true
 *                     level_kelas:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         nama:
 *                           type: string
 *             example:
 *               message: "Detail kelas kyorugi berhasil diambil"
 *               data:
 *                 id: 1
 *                 gender: "putra"
 *                 label: "under-34"
 *                 batas_bawah: null
 *                 batas_atas: 34
 *                 kategori_usia:
 *                   id: 2
 *                   nama: "Cadet"
 *                   min_age: 12
 *                   max_age: 14
 *                 level_kelas:
 *                   id: 2
 *                   nama: "pemula"
 *       400:
 *         description: ID tidak valid
 *       401:
 *         description: Token tidak valid
 *       403:
 *         description: Akses ditolak (bukan admin)
 *       404:
 *         description: Kelas kyorugi tidak ditemukan
 *       500:
 *         description: Kesalahan server
 */
router.get("/kelas-kyorugi/:id", getKelasKyorugiById);

/**
 * @swagger
 * /api/admin/kelas-kyorugi/update/{id}:
 *   put:
 *     summary: Update data kelas kyorugi
 *     tags: [Admin - Kejuaraan - Kelas Kyorugi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID kelas kyorugi yang akan diupdate
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               kategori_usia_id:
 *                 type: integer
 *                 description: ID kategori usia (opsional)
 *                 example: 2
 *               level_kelas_id:
 *                 type: integer
 *                 description: ID level kelas (opsional)
 *                 example: 2
 *               gender:
 *                 type: string
 *                 enum: [putra, putri]
 *                 description: Gender (opsional)
 *                 example: "putra"
 *               label:
 *                 type: string
 *                 description: Label kelas berat, harus mengandung angka (opsional)
 *                 example: "under-42"
 *               batas_bawah:
 *                 type: number
 *                 description: Batas berat minimal (kg), opsional, harus diisi bersama batas_atas
 *                 example: 35
 *               batas_atas:
 *                 type: number
 *                 description: Batas berat maksimal (kg), opsional, tidak boleh melebihi angka di label
 *                 example: 42
 *     responses:
 *       200:
 *         description: Kelas kyorugi berhasil diperbarui
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
 *                   $ref: '#/components/schemas/KelasKyorugiDetail'
 *       400:
 *         description: Validasi gagal
 *       401:
 *         description: Token tidak valid
 *       403:
 *         description: Akses ditolak (bukan admin)
 *       404:
 *         description: Kelas kyorugi tidak ditemukan / referensi tidak ditemukan
 *       409:
 *         description: Duplikasi data dengan record lain
 *       500:
 *         description: Kesalahan server
 */
router.put("/kelas-kyorugi/update/:id", updateKelasKyorugi);

/**
 * @swagger
 * /api/admin/kelas-kyorugi/delete/{id}:
 *   delete:
 *     summary: Hapus kelas kyorugi (hanya jika belum digunakan di kejuaraan)
 *     tags: [Admin - Kejuaraan - Kelas Kyorugi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID kelas kyorugi yang akan dihapus
 *         example: 1
 *     responses:
 *       200:
 *         description: Kelas kyorugi berhasil dihapus
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
 *               success: true
 *               message: "Kelas kyorugi under-34 berhasil dihapus"
 *       400:
 *         description: ID tidak valid
 *       401:
 *         description: Token tidak valid
 *       403:
 *         description: Akses ditolak (bukan admin)
 *       404:
 *         description: Kelas kyorugi tidak ditemukan
 *       409:
 *         description: Kelas kyorugi masih digunakan di kelas_kejuaraan
 *       500:
 *         description: Kesalahan server
 */
router.delete("/kelas-kyorugi/delete/:id", deleteKelasKyorugi);

/**
 * @swagger
 * /api/admin/kelas-poomsae:
 *   post:
 *     summary: Tambah kelas poomsae baru (master data)
 *     description: |
 *       Menambahkan kelas pertandingan Poomsae ke dalam sistem.
 *
 *       **Aturan:**
 *       - Kombinasi `kategori_usia_id`, `level_kelas_id`, `jurus_id`, `format_id`, dan `gender` harus unik.
 *       - `gender` boleh `null` untuk format campuran (misalnya pasangan atau freestyle).
 *     tags:
 *       - Admin - Kelas Poomsae
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - kategori_usia_id
 *               - level_kelas_id
 *               - jurus_id
 *               - format_id
 *             properties:
 *               kategori_usia_id:
 *                 type: integer
 *                 minimum: 1
 *                 description: |
 *                   ID kategori usia.
 *
 *                   Contoh:
 *                   - 1 = Pra-Cadet
 *                   - 2 = Cadet
 *                   - 3 = Junior
 *                   - 4 = Senior
 *                 example: 2
 *
 *               level_kelas_id:
 *                 type: integer
 *                 minimum: 1
 *                 description: |
 *                   ID level kelas.
 *
 *                   Contoh:
 *                   - 1 = Festival
 *                   - 2 = Pemula
 *                   - 3 = Prestasi
 *                 example: 2
 *
 *               gender:
 *                 type: string
 *                 nullable: true
 *                 enum:
 *                   - putra
 *                   - putri
 *                 description: |
 *                   Jenis kelamin peserta.
 *
 *                   - Isi "putra" atau "putri" jika format membutuhkan gender spesifik.
 *                   - Kosongkan atau kirim null untuk format campuran seperti pasangan atau freestyle team.
 *                 example: putra
 *
 *               jurus_id:
 *                 type: integer
 *                 description: |
 *                   ID jurus dari tabel poomsae_jurus.
 *
 *                   Contoh:
 *                   - Taegeuk Iljang
 *                   - Taegeuk Yijang
 *                   - Koryo
 *                   - Freestyle
 *                 example: 1
 *
 *               format_id:
 *                 type: integer
 *                 description: |
 *                   ID format dari tabel poomsae_format.
 *
 *                   Contoh:
 *                   - 1 = Tunggal
 *                   - 2 = Pasangan
 *                   - 3 = Beregu Putra
 *                   - 4 = Freestyle
 *                   - 5 = Beregu Putri
 *                 example: 1
 *
 *           example:
 *             kategori_usia_id: 2
 *             level_kelas_id: 2
 *             gender: putra
 *             jurus_id: 1
 *             format_id: 1
 *
 *     responses:
 *       201:
 *         description: Kelas poomsae berhasil ditambahkan
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
 *                     kategori_usia_id:
 *                       type: integer
 *                     level_kelas_id:
 *                       type: integer
 *                     gender:
 *                       type: string
 *                       nullable: true
 *                     jurus_id:
 *                       type: integer
 *                     format_id:
 *                       type: integer
 *             example:
 *               message: Kelas poomsae berhasil ditambahkan
 *               data:
 *                 id: 5
 *                 kategori_usia_id: 2
 *                 level_kelas_id: 2
 *                 gender: putra
 *                 jurus_id: 1
 *                 format_id: 1
 *
 *       400:
 *         description: Validasi gagal (input tidak lengkap atau format salah)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingField:
 *                 summary: Jurus tidak valid
 *                 value:
 *                   message: ID jurus tidak valid
 *
 *               invalidGender:
 *                 summary: Gender tidak valid
 *                 value:
 *                   message: Gender harus putra atau putri (atau kosongkan jika format campuran)
 *
 *       401:
 *         description: Token tidak valid atau tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *       403:
 *         description: Akses ditolak (bukan admin)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *       404:
 *         description: Referensi tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               jurusNotFound:
 *                 summary: Jurus tidak ditemukan
 *                 value:
 *                   message: Jurus tidak ditemukan
 *
 *       409:
 *         description: Kombinasi data sudah ada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Kelas poomsae dengan kombinasi tersebut sudah ada
 *
 *       500:
 *         description: Kesalahan server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/kelas-poomsae", verifyToken, createKelasPoomsae);

/**
 * @swagger
 * /api/admin/kelas-poomsae:
 *   get:
 *     summary: Ambil semua data kelas poomsae dengan pagination dan filter
 *     description: |
 *       Mendukung filter berdasarkan:
 *       - `gender` (putra/putri)
 *       - `kategori_usia_id`
 *       - `level_kelas_id`
 *       - `jurus_id`
 *       - `format_id`
 *       - Pencarian teks pada `jurus.name` atau `format.name`
 *     tags: [Admin - Kelas Poomsae]
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
 *         description: Cari berdasarkan nama jurus atau format (case-insensitive, partial match)
 *         example: "taegeuk"
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [putra, putri]
 *         description: Filter gender (kosongkan untuk menampilkan semua)
 *       - in: query
 *         name: kategori_usia_id
 *         schema:
 *           type: integer
 *         description: ID kategori usia (1:Pra-Cadet, 2:Cadet, 3:Junior, 4:Senior)
 *         example: 2
 *       - in: query
 *         name: level_kelas_id
 *         schema:
 *           type: integer
 *           enum: [1,2,3]
 *         description: ID level kelas (1:festival, 2:pemula, 3:prestasi)
 *       - in: query
 *         name: jurus_id
 *         schema:
 *           type: integer
 *         description: ID jurus (dari tabel poomsae_jurus)
 *       - in: query
 *         name: format_id
 *         schema:
 *           type: integer
 *         description: ID format (1:tunggal, 2:pasangan, 3:beregu putra, 4:freestyle, 5:beregu putri)
 *     responses:
 *       200:
 *         description: Berhasil mengambil data
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
 *                       gender:
 *                         type: string
 *                         nullable: true
 *                       kategori_usia:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           nama:
 *                             type: string
 *                       level_kelas:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           nama:
 *                             type: string
 *                       jurus:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           nama:
 *                             type: string
 *                       format:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           nama:
 *                             type: string
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
 *             example:
 *               success: true
 *               message: "Berhasil mengambil data kelas poomsae"
 *               data:
 *                 - id: 1
 *                   gender: "putra"
 *                   kategori_usia:
 *                     id: 2
 *                     nama: "Cadet"
 *                   level_kelas:
 *                     id: 1
 *                     nama: "festival"
 *                   jurus:
 *                     id: 1
 *                     nama: "Taegeuk Iljang"
 *                   format:
 *                     id: 1
 *                     nama: "tunggal"
 *               meta:
 *                 pagination:
 *                   current_page: 1
 *                   per_page: 10
 *                   total_page: 1
 *                   total_data: 5
 *                   has_next: false
 *                   has_prev: false
 *       400:
 *         description: Parameter tidak valid (misal gender salah)
 *       401:
 *         description: Token tidak valid
 *       403:
 *         description: Akses ditolak (bukan admin)
 *       500:
 *         description: Kesalahan server
 */
router.get("/kelas-poomsae", verifyToken, getAllKelasPoomsae);

/**
 * @swagger
 * /api/admin/kelas-poomsae/{id}:
 *   get:
 *     summary: Ambil detail kelas poomsae berdasarkan ID
 *     description: Mengembalikan informasi lengkap satu kelas poomsae termasuk referensi ke kategori usia, level kelas, jurus, dan format.
 *     tags: [Admin - Kelas Poomsae]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID kelas poomsae
 *         example: 1
 *     responses:
 *       200:
 *         description: Detail kelas poomsae berhasil diambil
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
 *                     gender:
 *                       type: string
 *                       nullable: true
 *                     kategori_usia:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         nama:
 *                           type: string
 *                     level_kelas:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         nama:
 *                           type: string
 *                     jurus:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         nama:
 *                           type: string
 *                     format:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         nama:
 *                           type: string
 *             example:
 *               message: "Detail kelas poomsae"
 *               data:
 *                 id: 1
 *                 gender: "putra"
 *                 kategori_usia:
 *                   id: 2
 *                   nama: "Cadet"
 *                 level_kelas:
 *                   id: 1
 *                   nama: "festival"
 *                 jurus:
 *                   id: 1
 *                   nama: "Taegeuk Iljang"
 *                 format:
 *                   id: 1
 *                   nama: "tunggal"
 *       400:
 *         description: ID tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "ID tidak valid"
 *       401:
 *         description: Token tidak valid atau tidak ditemukan
 *       403:
 *         description: Akses ditolak (bukan admin)
 *       404:
 *         description: Kelas poomsae tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Kelas poomsae tidak ditemukan"
 *       500:
 *         description: Kesalahan server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/kelas-poomsae/:id", verifyToken, getKelasPoomsaeById);

/**
 * @swagger
 * /api/admin/kelas-poomsae/{id}:
 *   put:
 *     summary: Update data kelas poomsae
 *     description: |
 *       Memperbarui data kelas poomsae berdasarkan ID.
 *       - Semua field bersifat opsional (hanya field yang dikirim akan diubah).
 *       - Kombinasi `kategori_usia_id`, `level_kelas_id`, `jurus_id`, `format_id`, dan `gender` harus unik (tidak boleh bentrok dengan kelas lain selain dirinya sendiri).
 *       - `gender` boleh `null` untuk format campuran (contoh: pasangan atau freestyle).
 *     tags: [Admin - Kelas Poomsae]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID kelas poomsae yang akan diupdate
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               kategori_usia_id:
 *                 type: integer
 *                 description: ID kategori usia (1:Pra-Cadet, 2:Cadet, 3:Junior, 4:Senior)
 *                 minimum: 1
 *               level_kelas_id:
 *                 type: integer
 *                 description: ID level kelas (1:festival, 2:pemula, 3:prestasi)
 *                 minimum: 1
 *               gender:
 *                 type: string
 *                 enum: [putra, putri]
 *                 nullable: true
 *                 description: Gender (kosongkan/null untuk format campuran)
 *               jurus_id:
 *                 type: integer
 *                 description: ID jurus dari tabel poomsae_jurus
 *                 minimum: 1
 *               format_id:
 *                 type: integer
 *                 description: ID format dari tabel poomsae_format
 *                 minimum: 1
 *           example:
 *             gender: "putri"
 *             jurus_id: 2
 *             format_id: 1
 *     responses:
 *       200:
 *         description: Kelas poomsae berhasil diperbarui
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
 *                     gender:
 *                       type: string
 *                       nullable: true
 *                     kategori_usia_id:
 *                       type: integer
 *                     level_kelas_id:
 *                       type: integer
 *                     jurus_id:
 *                       type: integer
 *                     format_id:
 *                       type: integer
 *             example:
 *               success: true
 *               message: "Kelas poomsae berhasil diperbarui"
 *               data:
 *                 id: 1
 *                 gender: "putri"
 *                 kategori_usia_id: 2
 *                 level_kelas_id: 2
 *                 jurus_id: 2
 *                 format_id: 1
 *       400:
 *         description: Validasi gagal (ID tidak valid, gender salah, dll)
 *       401:
 *         description: Token tidak valid atau tidak ditemukan
 *       403:
 *         description: Akses ditolak (bukan admin)
 *       404:
 *         description: Kelas poomsae tidak ditemukan / referensi (kategori usia, level, jurus, format) tidak ditemukan
 *       409:
 *         description: Duplikasi data (kombinasi sudah ada pada record lain)
 *       500:
 *         description: Kesalahan server
 */
router.put("/kelas-poomsae/:id", verifyToken, updateKelasPoomsae);

/**
 * @swagger
 * /api/admin/kelas-poomsae/{id}:
 *   delete:
 *     summary: Hapus kelas poomsae (hanya jika belum digunakan di kejuaraan)
 *     description: |
 *       Menghapus data kelas poomsae secara permanen.
 *       **Tidak dapat dihapus** jika sudah direferensikan oleh `kelas_kejuaraan` dengan tipe `poomsae`.
 *     tags: [Admin - Kelas Poomsae]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID kelas poomsae yang akan dihapus
 *         example: 5
 *     responses:
 *       200:
 *         description: Kelas poomsae berhasil dihapus
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "Kelas poomsae berhasil dihapus"
 *       400:
 *         description: ID tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "ID tidak valid"
 *       401:
 *         description: Token tidak valid atau tidak ditemukan
 *       403:
 *         description: Akses ditolak (bukan admin)
 *       404:
 *         description: Kelas poomsae tidak ditemukan
 *       409:
 *         description: Kelas poomsae sedang digunakan di kejuaraan, tidak dapat dihapus
 *       500:
 *         description: Kesalahan server
 */
router.delete("/kelas-poomsae/:id", verifyToken, deleteKelasPoomsae);

module.exports = router;
