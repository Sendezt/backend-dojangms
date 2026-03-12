const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/authJwt");

const upload = require("../middlewares/uploadFoto");
const { CompleteProfile } = require("../controllers/auth/CompleteProfile");
const { login } = require("../controllers/auth/LoginController");
const { Register } = require("../controllers/auth/RegisterController");

router.post("/login", login);
router.post("/register", Register);
router.put(
  "/complete-profile",
  verifyToken,
  upload.single("foto"),
  CompleteProfile,
);

module.exports = router;
