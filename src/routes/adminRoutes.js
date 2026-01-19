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

// user route
router.get("/getall/user", getAllUsers);
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
router.patch("/update/roles/:id", updateUserRoles);

module.exports = router;
