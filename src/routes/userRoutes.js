const express = require("express");
const router = express.Router();
const { createUser } = require("../controllers/admin/CreateUserController");
const { getAllUsers } = require("../controllers/admin/GetAllUserController");
const { getUserById } = require("../controllers/admin/GetUserbyIdController");

router.post("/create", createUser);
router.get("/getall", getAllUsers);
router.get("/get/:id", getUserById);

module.exports = router;
