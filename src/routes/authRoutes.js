const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/authJwt");

const upload = require("../middlewares/uploadFoto");
const { CompleteProfile } = require("../controllers/auth/CompleteProfile");
const { login } = require("../controllers/auth/LoginController");
const { Register } = require("../controllers/auth/RegisterController");
const {
  resetPasswordLupa,
} = require("../controllers/auth/resetPasswordController");

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and authorization
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post("/login", login);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post("/register", Register);

/**
 * @swagger
 * /api/auth/complete-profile:
 *   put:
 *     summary: Complete user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               foto:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile completed successfully
 */
router.put(
  "/complete-profile",
  verifyToken,
  upload.single("foto"),
  CompleteProfile,
);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password (lupa password) – tanpa verifikasi email, menggunakan email + phone
 *     description: |
 *       Endpoint ini digunakan untuk mereset password ketika user lupa.
 *       User harus memasukkan email dan nomor telepon yang terdaftar.
 *       Jika kombinasi cocok, password akan direset tanpa verifikasi email.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - phone
 *               - new_password
 *               - confirm_password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               phone:
 *                 type: string
 *                 example: "081234567890"
 *               new_password:
 *                 type: string
 *                 format: password
 *                 example: "newpassword123"
 *               confirm_password:
 *                 type: string
 *                 format: password
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: Password berhasil direset
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *             example:
 *               success: true
 *               message: "Password berhasil direset. Silakan login dengan password baru."
 *       400:
 *         description: Validasi gagal (field kosong, password tidak cocok, atau kurang dari 6 karakter)
 *       404:
 *         description: Email dan nomor telepon tidak cocok atau akun tidak aktif
 *       500:
 *         description: Server error
 */
router.post("/reset-password", resetPasswordLupa);

module.exports = router;
