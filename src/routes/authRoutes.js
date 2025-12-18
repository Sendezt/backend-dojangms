const express = require("express");
const router = express.Router();

const { Login } = require("../controllers/auth/LoginController");

router.post("/login", Login);

module.exports = router;
