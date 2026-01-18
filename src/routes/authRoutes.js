const express = require("express");
const router = express.Router();

const { login } = require("../controllers/auth/LoginController");
const { Register } = require("../controllers/auth/RegisterController");

router.post("/login", login);
router.post("/register", Register);

module.exports = router;
