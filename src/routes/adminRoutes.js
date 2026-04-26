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
 *     summary: Create new user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
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
router.post("/create/user", verifyToken, authorizeRole("admin"), createUser);

/**
 * @swagger
 * /api/admin/update/user/{id}:
 *   patch:
 *     summary: Update user
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
