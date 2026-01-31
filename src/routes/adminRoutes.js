const express = require("express");
const router = express.Router();

// user
const { getAllUsers } = require("../controllers/admin/GetAllUserController");
const { getUserById } = require("../controllers/admin/GetUserbyIdController");
const { createUser } = require("../controllers/admin/CreateUserController");
const { updateUser } = require("../controllers/admin/UpdateUserController");
const { deleteUser } = require("../controllers/admin/DeleteUserController");

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

// user route
router.get("/get/user", getAllUsers);
router.get("/get/user/:id", getUserById);
router.post("/create/user", createUser);
router.patch("/update/user/:id", updateUser);
router.delete("/delete/user/:id", deleteUser);

//championship route
router.get("/get/championship", getAllChampionships);
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
router.post("/create/championship/participant/:id", addParticipant);

module.exports = router;
