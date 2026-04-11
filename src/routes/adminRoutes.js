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

// Pelatih Route
router.get("/get/pelatih/counts", getPelatihCounts);
router.get("/get/user/pelatih", getAllPelatih);
router.get("/get/user/pelatih/:id", getPelatihById);

// Murid Route
router.get("/get/user/murid", getUserMuridOnly);

// user route
router.get("/get/user/all", getTotalMurid);
router.get("/get/user", getUser);
router.get("/get/user/piechart/belt", getMuridCompositionByBelt);
router.get("/get/user/piechart/age", getMuridCompositionByAge);
// user chart route
router.get("/get/user/stats", getMonthlyMuridStats);
router.get("/get/user/chart", getChartData);
router.get("/get/user/chart/all", getChartDataAll);
router.get("/get/user/:id", getUserById);
router.post("/create/user", verifyToken, authorizeRole("admin"), createUser);
router.patch("/update/user/:id", updateUser);
router.delete("/delete/user/:id", deleteUser);
router.patch("/softdelete/user/:id", softDeleteUser);
//championship route
router.get("/get/championship", getAllChampionships);
router.get("/get/championship/5years", getKejuaraanStats5Years);
router.get("/get/championship/3months", getUpcomingKejuaraan3Months);
router.get("/get/championship/:id", getChampionshipById);
router.post("/create/championship", createChampionship);
router.patch("/update/championship/:id", updateChampionship);
router.delete("/delete/championship/:id", deleteChampionship);

// role route
router.get("/get/roles", getAllRoles);
router.patch("/update/roles/:id", updateUserRoles);

// belt route
router.get("/get/belts/:id", getBeltById);
router.post("/create/belts", createBelt);
router.patch("/update/belts/:id", updateBelt);
router.delete("/delete/belts/:id", deleteBelt);

// championship participant route
router.post(
  "/create/championship/participant/:championship_id",
  addParticipant,
);

module.exports = router;
