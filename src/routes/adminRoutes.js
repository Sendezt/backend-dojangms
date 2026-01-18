const express = require("express");
const router = express.Router();

const { getAllUsers } = require("../controllers/admin/GetAllUserController");
const { getUserById } = require("../controllers/admin/GetUserbyIdController");
const { createUser } = require("../controllers/admin/CreateUserController");

router.post("/create", createUser);
router.get("/getall", getAllUsers);
router.get("/get/:id", getUserById);

module.exports = router;
