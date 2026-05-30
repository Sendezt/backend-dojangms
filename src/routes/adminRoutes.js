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
} = require("../controllers/admin/kejuaraan/getKejuaraanStats5YearsController");
const {
  getUpcomingKejuaraan3Months,
} = require("../controllers/admin/kejuaraan/getUpcomingKejuaraan3MonthsController");

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
 *                 belt_id: 5
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
router.post("/create/user", verifyToken, authorizeRole("admin"), createUser);

/**
 * @swagger
 * /api/admin/update/user/{id}:
 *   patch:
 *     summary: Update data user
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID user yang akan diupdate
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               phone:
 *                 type: string
 *                 example: "081234567890"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *               tanggal_lahir:
 *                 type: string
 *                 format: date
 *                 example: "2000-01-15"
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 example: active
 *               belt_id:
 *                 type: integer
 *                 description: ID sabuk baru dari tabel belts
 *                 example: 3
 *               belt_achieved_at:
 *                 type: string
 *                 format: date
 *                 description: Tanggal pencapaian sabuk (opsional, default hari ini)
 *                 example: "2025-05-01"
 *           examples:
 *             updateBiasa:
 *               summary: Update data profil saja
 *               value:
 *                 name: John Doe
 *                 email: john@example.com
 *                 phone: "081234567890"
 *                 tanggal_lahir: "2000-01-15"
 *                 status: active
 *             updateSabuk:
 *               summary: Update sabuk saja
 *               value:
 *                 belt_id: 3
 *                 belt_achieved_at: "2025-05-01"
 *             updateKeduanya:
 *               summary: Update profil sekaligus sabuk
 *               value:
 *                 name: John Doe
 *                 status: active
 *                 belt_id: 3
 *                 belt_achieved_at: "2025-05-01"
 *     responses:
 *       200:
 *         description: User berhasil diperbarui
 *         content:
 *           application/json:
 *             examples:
 *               tanpaSabuk:
 *                 summary: Response tanpa update sabuk
 *                 value:
 *                   message: User berhasil diperbarui
 *                   data:
 *                     id: 1
 *                     name: John Doe
 *                     email: john@example.com
 *                     phone: "081234567890"
 *                     tanggal_lahir: "2000-01-15"
 *                     tahun_lahir: 2000
 *                     status: active
 *               denganSabuk:
 *                 summary: Response dengan update sabuk
 *                 value:
 *                   message: User berhasil diperbarui
 *                   data:
 *                     id: 1
 *                     name: John Doe
 *                     email: john@example.com
 *                     phone: "081234567890"
 *                     tanggal_lahir: "2000-01-15"
 *                     tahun_lahir: 2000
 *                     status: active
 *                     sabuk_saat_ini:
 *                       id: 3
 *                       name: Kuning Strip Hijau
 *       400:
 *         description: Validasi gagal
 *         content:
 *           application/json:
 *             examples:
 *               idKosong:
 *                 value:
 *                   message: ID user wajib diisi
 *               fieldKosong:
 *                 value:
 *                   message: Minimal satu field harus diupdate
 *               emailSudahAda:
 *                 value:
 *                   message: Email sudah digunakan
 *               statusTidakValid:
 *                 value:
 *                   message: Status tidak valid
 *               tanggalTidakValid:
 *                 value:
 *                   message: Format tanggal lahir tidak valid
 *               sabukTidakDitemukan:
 *                 value:
 *                   message: Sabuk tidak ditemukan
 *       404:
 *         description: User tidak ditemukan
 *         content:
 *           application/json:
 *             example:
 *               message: User tidak ditemukan
 *       500:
 *         description: Terjadi kesalahan pada server
 *         content:
 *           application/json:
 *             example:
 *               message: Terjadi kesalahan pada server
 */
router.patch("/update/user/:id", updateUser);

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
