const express = require("express");
const router = express.Router();
const { createUser } = require("../controllers/user/CreateUserController");
const { getAllUsers } = require("../controllers/user/GetAllUserController");
const { getUserById } = require("../controllers/user/GetUserbyIdController");

router.post("/create", createUser);
router.get("/getall", getAllUsers);
router.get("/get/:id", getUserById);

module.exports = router;
