const express = require("express");
const router = express.Router();

const { Login } = require("../controllers/auth/LoginController");
const { Register } = require("../controllers/auth/RegisterController");

router.post("/login", Login);
router.post("/register", Register);

module.exports = router;
