const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/authJwt");
const { authorizeRole } = require("../middlewares/roleAdmin");

// Pelatih
const {
  getPelatihCounts,
} = require("../controllers/admin/pelatih/getPelatihCount");
const {
  getAllPelatih,
} = require("../controllers/admin/pelatih/getPelatihController");
const {
  getPelatihById,
} = require("../controllers/admin/pelatih/getPelatihByIdController");

// Murid
const {
  getUserMuridOnly,
} = require("../controllers/admin/murid/getUserMuridOnlyController");

// user
const {
  getAllUsers,
  getChartData,
  getChartDataAll,
} = require("../controllers/admin/GetAllUserController");
const {
  getTotalMurid,
} = require("../controllers/admin/user/getTotalMuridController");
const {
  getMonthlyMuridStats,
} = require("../controllers/admin/GetUsersMonthlyStatsController");
const { getUser } = require("../controllers/admin/user/GetUserController");
const {
  getMuridCompositionByBelt,
} = require("../controllers/admin/user/getMuridCompositionByBeltController");
const {
  getMuridCompositionByAge,
} = require("../controllers/admin/user/getMuridCompositionByAgeController");
const { getUserById } = require("../controllers/admin/GetUserbyIdController");
const {
  createUser,
} = require("../controllers/admin/user/CreateUserController");
const { updateUser } = require("../controllers/admin/UpdateUserController");
const { deleteUser } = require("../controllers/admin/DeleteUserController");
const {
  softDeleteUser,
} = require("../controllers/admin/user/SoftDeleteUserController");

// championship
const {
  getAllChampionships,
} = require("../controllers/admin/GetAllChampionshipController");
const {
  getChampionshipById,
} = require("../controllers/admin/GetChampionshipbyIdController");
const {
  createChampionship,
} = require("../controllers/admin/CreateChampionshipController");
const {
  updateChampionship,
} = require("../controllers/admin/UpdateChampionshipController");
const {
  deleteChampionship,
} = require("../controllers/admin/DeleteChampioshipController");
const {
  getKejuaraanStats5Years,
} = require("../controllers/admin/getKejuaraanStats5YearsController");
const {
  getUpcomingKejuaraan3Months,
} = require("../controllers/admin/getUpcomingKejuaraan3MonthsController");

// role
const {
  updateUserRoles,
} = require("../controllers/admin/UpdateRoleController");
const { getAllRoles } = require("../controllers/admin/GetAllRolesController");

// belt
const { getBeltById } = require("../controllers/admin/GetBeltByIdController");
const { createBelt } = require("../controllers/admin/CreateBeltController");
const { updateBelt } = require("../controllers/admin/UpdateBeltController");
const { deleteBelt } = require("../controllers/admin/DeleterBeltController");

// championship participant
const {
  addParticipant,
} = require("../controllers/admin/AddParticipantChampionshipController");

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin operations
 */

/**
 * @swagger
 * /api/admin/get/pelatih/counts:
 *   get:
 *     summary: Get pelatih counts
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Success
 */
// Pelatih Route
router.get("/get/pelatih/counts", getPelatihCounts);

/**
 * @swagger
 * /api/admin/get/user/pelatih:
 *   get:
 *     summary: Get all pelatih
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/get/user/pelatih", getAllPelatih);

/**
 * @swagger
 * /api/admin/get/user/pelatih/{id}:
 *   get:
 *     summary: Get pelatih by ID
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/get/user/pelatih/:id", getPelatihById);

/**
 * @swagger
 * /api/admin/get/user/murid:
 *   get:
 *     summary: Get murid only
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Success
 */
// Murid Route
router.get("/get/user/murid", getUserMuridOnly);

/**
 * @swagger
 * /api/admin/get/user/all:
 *   get:
 *     summary: Get total murid
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Success
 */
// user route
router.get("/get/user/all", getTotalMurid);

/**
 * @swagger
 * /api/admin/get/user:
 *   get:
 *     summary: Get user
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/get/user", getUser);

/**
 * @swagger
 * /api/admin/get/user/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/get/user/:id", getUserById);

/**
 * @swagger
 * /api/admin/get/user/piechart/belt:
 *   get:
 *     summary: Get murid composition by belt
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/get/user/piechart/belt", getMuridCompositionByBelt);

/**
 * @swagger
 * /api/admin/get/user/piechart/age:
 *   get:
 *     summary: Get murid composition by age
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/get/user/piechart/age", getMuridCompositionByAge);

/**
 * @swagger
 * /api/admin/get/user/stats:
 *   get:
 *     summary: Get monthly murid stats
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Success
 */
// user chart route
router.get("/get/user/stats", getMonthlyMuridStats);

/**
 * @swagger
 * /api/admin/get/user/chart:
 *   get:
 *     summary: Get user chart data
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/get/user/chart", getChartData);

/**
 * @swagger
 * /api/admin/get/user/chart/all:
 *   get:
 *     summary: Get all user chart data
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/get/user/chart/all", getChartDataAll);

/**
 * @swagger
 * /api/admin/get/user/pelatih/{id}:
 *   get:
 *     summary: Get detail pelatih by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID user (pelatih)
 *         example: 2
 *     responses:
 *       200:
 *         description: Berhasil mengambil detail pelatih
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Berhasil mengambil detail pelatih"
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
 *                       enum: [laki-laki, perempuan]
 *                       nullable: true
 *                     alamat:
 *                       type: string
 *                       nullable: true
 *                     tanggal_lahir:
 *                       type: string
 *                       format: date
 *                     tanggal_bergabung:
 *                       type: string
 *                       format: date-time
 *                     status:
 *                       type: string
 *                       enum: [active, inactive]
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                     pelatih:
 *                       type: object
 *                       properties:
 *                         spesialisasi:
 *                           type: string
 *                           enum: [kyorugi, poomsae, keduanya, all, "kyourigi & poomsae"]
 *                           nullable: true
 *                         bio:
 *                           type: string
 *                           nullable: true
 *                         sertifikasi:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               nama:
 *                                 type: string
 *                           description: Daftar sertifikasi dengan ID masing-masing
 *                     sabuk_saat_ini:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                       nullable: true
 *                     kelas_diampu:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           nama:
 *                             type: string
 *                           status:
 *                             type: string
 *                           jumlah_murid:
 *                             type: integer
 *                           jadwal:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 hari:
 *                                   type: string
 *                                   enum: [senin, selasa, rabu, kamis, jumat, sabtu, minggu]
 *                                 jam_mulai:
 *                                   type: string
 *                                   format: time
 *                                 jam_selesai:
 *                                   type: string
 *                                   format: time
 *                                 lokasi:
 *                                   type: string
 *                     total_murid:
 *                       type: integer
 *             example:
 *               message: "Berhasil mengambil detail pelatih"
 *               data:
 *                 id: 2
 *                 name: "Pelatih Satu"
 *                 email: "pelatih.satu@gmail.com"
 *                 phone: "082345678901"
 *                 foto: null
 *                 jenis_kelamin: null
 *                 alamat: null
 *                 tanggal_lahir: "1990-03-20"
 *                 tanggal_bergabung: "2026-04-11T15:37:55.000Z"
 *                 status: "active"
 *                 updated_at: "2026-04-11T15:37:55.000Z"
 *                 pelatih:
 *                   spesialisasi: "kyorugi"
 *                   bio: null
 *                   sertifikasi:
 *                     - id: 1
 *                       nama: "Sertifikasi Nasional"
 *                     - id: 2
 *                       nama: "Pelatih Kyorugi Level 1"
 *                 sabuk_saat_ini:
 *                   id: 12
 *                   name: "DAN I"
 *                 kelas_diampu:
 *                   - id: 1
 *                     nama: "Kelas Kyorugi Pemula"
 *                     status: "aktif"
 *                     jumlah_murid: 15
 *                     jadwal:
 *                       - hari: "senin"
 *                         jam_mulai: "16:00:00"
 *                         jam_selesai: "18:00:00"
 *                         lokasi: "GOR Utama"
 *                 total_murid: 15
 *       400:
 *         description: ID pelatih tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "ID pelatih tidak valid"
 *       401:
 *         description: Token tidak valid atau tidak ditemukan
 *       403:
 *         description: Akses ditolak (bukan admin)
 *       404:
 *         description: Pelatih tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Pelatih tidak ditemukan"
 *       500:
 *         description: Kesalahan server
 */
router.get("/get/user/pelatih/:id", getPelatihById);

/**
 * @swagger
 * /api/admin/create/user:
 *   post:
 *     summary: Membuat user baru
 *     description: |
 *       Digunakan untuk membuat user baru dengan role murid, pelatih, atau admin.
 *
 *       Catatan:
 *       - Jika roles tidak dikirim, otomatis menjadi "murid".
 *       - Untuk role "pelatih" akan dibuat data pada tabel pelatih.
 *       - Untuk role "murid" atau "pelatih" akan dibuat data belt awal.
 *       - Hanya admin yang dapat membuat user dengan role admin atau pelatih.
 *     tags:
 *       - Admin
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
 *               - email
 *               - password
 *               - tanggal_lahir
 *             properties:
 *               name:
 *                 type: string
 *                 example: Budi Santoso
 *               email:
 *                 type: string
 *                 format: email
 *                 example: budi@mail.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *               phone:
 *                 type: string
 *                 example: "081234567890"
 *               tanggal_lahir:
 *                 type: string
 *                 format: date
 *                 example: "2010-05-20"
 *               status:
 *                 type: string
 *                 enum:
 *                   - active
 *                   - inactive
 *                 example: active
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum:
 *                     - admin
 *                     - pelatih
 *                     - murid
 *                 example:
 *                   - murid
 *               belt_id:
 *                 type: integer
 *                 example: 1
 *               spesialisasi:
 *                 type: string
 *                 enum:
 *                   - poomsae
 *                   - kyorugi
 *                   - keduanya
 *                 example: keduanya
 *               sertifikasi:
 *                 type: string
 *                 description: Sertifikasi pelatih (hanya untuk role pelatih)
 *                 example: "Sertifikasi A"
 *
 *           examples:
 *             Murid:
 *               value:
 *                 name: Budi Santoso
 *                 email: budi@mail.com
 *                 password: password123
 *                 phone: "081234567890"
 *                 tanggal_lahir: "2010-05-20"
 *                 status: active
 *                 roles:
 *                   - murid
 *                 belt_id: 1
 *
 *             Pelatih:
 *               value:
 *                 name: Ahmad Wijaya
 *                 email: ahmad@mail.com
 *                 password: password123
 *                 phone: "081234567890"
 *                 tanggal_lahir: "1990-01-10"
 *                 status: active
 *                 roles:
 *                   - pelatih
 *                 spesialisasi: keduanya
 *                 sertifikasi: "Sertifikasi A"
 *                 belt_id: 5
 *
 *             Admin:
 *               value:
 *                 name: Admin Satu
 *                 email: admin.satu@gmail.com
 *                 password: admin.satu@gmail.com
 *                 phone: "081234567890"
 *                 tanggal_lahir: "1990-01-10"
 *                 status: active
 *                 roles:
 *                   - admin
 *
 *     responses:
 *       201:
 *         description: User berhasil dibuat
 *         content:
 *           application/json:
 *             example:
 *               message: User berhasil dibuat
 *               data:
 *                 id: 15
 *                 name: Budi Santoso
 *                 email: budi@mail.com
 *                 roles:
 *                   - murid
 *
 *       400:
 *         description: Data tidak valid
 *         content:
 *           application/json:
 *             examples:
 *               RequiredField:
 *                 value:
 *                   message: Name, email, password, dan tanggal lahir wajib diisi
 *
 *               InvalidDate:
 *                 value:
 *                   message: Format tanggal lahir tidak valid
 *
 *               InvalidRole:
 *                 value:
 *                   message: Ada role yang tidak valid
 *
 *               InvalidBelt:
 *                 value:
 *                   message: Belt tidak valid
 *
 *       403:
 *         description: Tidak memiliki hak akses
 *         content:
 *           application/json:
 *             examples:
 *               CreateAdmin:
 *                 value:
 *                   message: Hanya admin yang bisa membuat user dengan role admin
 *
 *               CreatePelatih:
 *                 value:
 *                   message: Hanya admin yang bisa membuat user dengan role pelatih
 *
 *       409:
 *         description: Email sudah digunakan
 *         content:
 *           application/json:
 *             example:
 *               message: Email sudah terdaftar
 *
 *       500:
 *         description: Terjadi kesalahan server
 *         content:
 *           application/json:
 *             example:
 *               message: Gagal membuat user
 *               error: Internal server error
 */
// router.post("/create/user", verifyToken, authorizeRole("admin"), createUser);
router.post("/create/user", createUser);

/**
 * @swagger
 * /api/admin/update/user/{id}:
 *   patch:
 *     summary: Update data user berdasarkan role (Murid / Pelatih / Admin)
 *     description: |
 *       Field yang dapat diupdate tergantung role user yang sedang diupdate:
 *
 *       **Murid**:
 *       - Nama Lengkap, No Telepon, email, tanggal lahir, status, sabuk
 *
 *       **Pelatih**:
 *       - Semua field Murid + spesialisasi, bio, sertifikasi (bisa multi/single)
 *
 *       **Admin**:
 *       - Nama Lengkap, No Telepon, email, tanggal lahir, status
 *     tags: [Admin - Manajemen User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID user yang akan diupdate
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               # Field umum untuk semua role
 *               name:
 *                 type: string
 *                 description: Nama lengkap (semua role)
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email (semua role)
 *               phone:
 *                 type: string
 *                 description: No telepon (semua role)
 *               tanggal_lahir:
 *                 type: string
 *                 format: date
 *                 description: Tanggal lahir (semua role)
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: Status akun (semua role)
 *               # Field untuk Murid dan Pelatih
 *               belt_id:
 *                 type: integer
 *                 description: ID sabuk baru (Murid dan Pelatih)
 *               belt_achieved_at:
 *                 type: string
 *                 format: date
 *                 description: Tanggal pencapaian sabuk (Murid dan Pelatih)
 *               # Field khusus Pelatih
 *               spesialisasi:
 *                 type: string
 *                 enum: [kyorugi, poomsae, keduanya, all, "kyourigi & poomsae"]
 *                 description: Spesialisasi (khusus Pelatih)
 *               bio:
 *                 type: string
 *                 description: Biografi (khusus Pelatih)
 *               sertifikasi:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - nama
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: ID sertifikasi yang akan diedit
 *                     nama:
 *                       type: string
 *                       description: Nama baru sertifikasi
 *                 description: Daftar sertifikasi (khusus Pelatih) - edit per ID
 *                 example: [{ id: 5, nama: "Sertifikasi Baru" }]
 *           examples:
 *             updateMurid:
 *               summary: Update data murid (nama, email, sabuk)
 *               value:
 *                 name: "Budi Santoso"
 *                 email: "budi@example.com"
 *                 phone: "08123456789"
 *                 tanggal_lahir: "2010-05-10"
 *                 status: "active"
 *                 belt_id: 5
 *             updatePelatih:
 *               summary: Update data pelatih (semua field termasuk sertifikasi)
 *               value:
 *                 name: "Susi Susanti"
 *                 email: "susi@example.com"
 *                 phone: "08123456789"
 *                 status: "active"
 *                 belt_id: 12
 *                 spesialisasi: "poomsae"
 *                 bio: "Pelatih berpengalaman 10 tahun"
 *                 sertifikasi: [{ id: 2, nama: "Sertifikasi Pelatih Daerah" }]
 *             updateAdmin:
 *               summary: Update data admin (hanya field dasar)
 *               value:
 *                 name: "Admin Baru"
 *                 phone: "087654321"
 *                 status: "active"
 *     responses:
 *       200:
 *         description: User berhasil diperbarui
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
 *                     tanggal_lahir:
 *                       type: string
 *                     tahun_lahir:
 *                       type: integer
 *                     status:
 *                       type: string
 *                     roles:
 *                       type: array
 *                       items:
 *                         type: string
 *                     sabuk_saat_ini:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                     pelatih:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         spesialisasi:
 *                           type: string
 *                         bio:
 *                           type: string
 *                           nullable: true
 *                         sertifikasi:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               nama:
 *                                 type: string
 *             examples:
 *               responseMurid:
 *                 value:
 *                   message: "User berhasil diperbarui"
 *                   data:
 *                     id: 1
 *                     name: "Budi Santoso"
 *                     email: "budi@example.com"
 *                     phone: "08123456789"
 *                     tanggal_lahir: "2010-05-10"
 *                     tahun_lahir: 2010
 *                     status: "active"
 *                     roles: ["murid"]
 *                     sabuk_saat_ini: { id: 5, name: "Hijau Strip Biru" }
 *               responsePelatih:
 *                 value:
 *                   message: "User berhasil diperbarui"
 *                   data:
 *                     id: 2
 *                     name: "Susi Susanti"
 *                     email: "susi@example.com"
 *                     phone: "08123456789"
 *                     tanggal_lahir: "1990-03-20"
 *                     tahun_lahir: 1990
 *                     status: "active"
 *                     roles: ["pelatih"]
 *                     sabuk_saat_ini: { id: 12, name: "DAN I" }
 *                     pelatih:
 *                       spesialisasi: "poomsae"
 *                       bio: "Pelatih berpengalaman 10 tahun"
 *                       sertifikasi: [{ id: 2, nama: "Sertifikasi Pelatih Daerah" }]
 *               responseAdmin:
 *                 value:
 *                   message: "User berhasil diperbarui"
 *                   data:
 *                     id: 3
 *                     name: "Admin Baru"
 *                     email: "admin@example.com"
 *                     phone: "087654321"
 *                     tanggal_lahir: "1988-07-10"
 *                     tahun_lahir: 1988
 *                     status: "active"
 *                     roles: ["admin"]
 *       400:
 *         description: Validasi gagal (field tidak sesuai role, data tidak valid, atau ID sertifikasi bukan milik pelatih)
 *       401:
 *         description: Token tidak valid atau tidak ditemukan
 *       403:
 *         description: Akses ditolak (misal non-admin mencoba mengubah role)
 *       404:
 *         description: User tidak ditemukan
 *       500:
 *         description: Kesalahan server
 */
router.patch("/update/user/:id", verifyToken, updateUser);

/**
 * @swagger
 * /api/admin/delete/user/{id}:
 *   delete:
 *     summary: Delete user
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.delete("/delete/user/:id", deleteUser);

/**
 * @swagger
 * /api/admin/softdelete/user/{id}:
 *   patch:
 *     summary: Soft delete user
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.patch("/softdelete/user/:id", softDeleteUser);

/**
 * @swagger
 * /api/admin/get/championship:
 *   get:
 *     summary: Get all championships
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Success
 */
//championship route
router.get("/get/championship", getAllChampionships);

/**
 * @swagger
 * /api/admin/get/championship/5years:
 *   get:
 *     summary: Get championship stats 5 years
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/get/championship/5years", getKejuaraanStats5Years);

/**
 * @swagger
 * /api/admin/get/championship/3months:
 *   get:
 *     summary: Get upcoming championships in 3 months
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/get/championship/3months", getUpcomingKejuaraan3Months);

/**
 * @swagger
 * /api/admin/get/championship/{id}:
 *   get:
 *     summary: Get championship by ID
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/get/championship/:id", getChampionshipById);

/**
 * @swagger
 * /api/admin/create/championship:
 *   post:
 *     summary: Create championship
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Created
 */
router.post("/create/championship", createChampionship);

/**
 * @swagger
 * /api/admin/update/championship/{id}:
 *   patch:
 *     summary: Update championship
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Success
 */
router.patch("/update/championship/:id", updateChampionship);

/**
 * @swagger
 * /api/admin/delete/championship/{id}:
 *   delete:
 *     summary: Delete championship
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.delete("/delete/championship/:id", deleteChampionship);

/**
 * @swagger
 * /api/admin/get/roles:
 *   get:
 *     summary: Get all roles
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Success
 */
// role route
router.get("/get/roles", getAllRoles);

/**
 * @swagger
 * /api/admin/update/roles/{id}:
 *   patch:
 *     summary: Update user roles
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Success
 */
router.patch("/update/roles/:id", updateUserRoles);

/**
 * @swagger
 * /api/admin/get/belts/{id}:
 *   get:
 *     summary: Get belt by ID
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
// belt route
router.get("/get/belts/:id", getBeltById);

/**
 * @swagger
 * /api/admin/create/belts:
 *   post:
 *     summary: Create belt
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Created
 */
router.post("/create/belts", createBelt);

/**
 * @swagger
 * /api/admin/update/belts/{id}:
 *   patch:
 *     summary: Update belt
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Success
 */
router.patch("/update/belts/:id", updateBelt);

/**
 * @swagger
 * /api/admin/delete/belts/{id}:
 *   delete:
 *     summary: Delete belt
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.delete("/delete/belts/:id", deleteBelt);

/**
 * @swagger
 * /api/admin/create/championship/participant/{championship_id}:
 *   post:
 *     summary: Add participant to championship
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: championship_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Created
 */
// championship participant route
router.post(
  "/create/championship/participant/:championship_id",
  addParticipant,
);

module.exports = router;
