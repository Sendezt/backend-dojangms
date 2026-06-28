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
const { getProfile } = require("../controllers/auth/profileController");

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
 *     summary: Lengkapi / Update profil user (foto, telepon, alamat, dll)
 *     description: |
 *       Endpoint ini digunakan untuk melengkapi atau memperbarui data profil user.
 *       Semua field bersifat opsional – minimal satu field harus dikirim.
 *
 *       **Catatan:**
 *       - Gunakan `multipart/form-data` jika ingin upload foto.
 *       - Untuk field teks, bisa dikirim sebagai `form-data` atau `application/json`.
 *       - Foto akan disimpan di folder `uploads/users/` dan path-nya disimpan di database.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *                 description: Nomor telepon user
 *                 example: "081234567890"
 *               alamat:
 *                 type: string
 *                 description: Alamat lengkap user
 *                 example: "Jl. Merdeka No. 10, Salatiga"
 *               jenis_kelamin:
 *                 type: string
 *                 enum: [laki-laki, perempuan]
 *                 description: Jenis kelamin user
 *                 example: "laki-laki"
 *               nama_wali:
 *                 type: string
 *                 description: Nama wali / orang tua (untuk murid)
 *                 example: "Budi Santoso"
 *               no_wali:
 *                 type: string
 *                 description: Nomor telepon wali
 *                 example: "082345678901"
 *               foto:
 *                 type: string
 *                 format: binary
 *                 description: File foto profil (gambar)
 *           example:
 *             phone: "081234567890"
 *             alamat: "Jl. Merdeka No. 10, Salatiga"
 *             jenis_kelamin: "laki-laki"
 *             nama_wali: "Budi Santoso"
 *             no_wali: "082345678901"
 *     responses:
 *       200:
 *         description: Profil berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Profile berhasil diperbarui"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 7
 *                     name:
 *                       type: string
 *                       example: "Pelatih Satu"
 *                     email:
 *                       type: string
 *                       example: "pelatih.satu@gmail.com"
 *                     phone:
 *                       type: string
 *                       example: "081234567890"
 *                     foto:
 *                       type: string
 *                       example: "uploads/users/foto-1234567890.jpg"
 *                     alamat:
 *                       type: string
 *                       example: "Jl. Merdeka No. 10, Salatiga"
 *                     jenis_kelamin:
 *                       type: string
 *                       example: "laki-laki"
 *                     nama_wali:
 *                       type: string
 *                       example: "Budi Santoso"
 *                     no_wali:
 *                       type: string
 *                       example: "082345678901"
 *             example:
 *               message: "Profile berhasil diperbarui"
 *               data:
 *                 id: 7
 *                 name: "Pelatih Satu"
 *                 email: "pelatih.satu@gmail.com"
 *                 phone: "081234567890"
 *                 foto: "uploads/users/foto-1234567890.jpg"
 *                 alamat: "Jl. Merdeka No. 10, Salatiga"
 *                 jenis_kelamin: "laki-laki"
 *                 nama_wali: "Budi Santoso"
 *                 no_wali: "082345678901"
 *       400:
 *         description: Tidak ada data yang dikirim
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Tidak ada data yang dikirim"
 *       401:
 *         description: Unauthorized – token tidak valid atau tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Unauthorized"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Gagal update profile"
 *               error: "Database connection error"
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

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Ambil data profil user yang sedang login
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil profil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     foto:
 *                       type: string
 *                     alamat:
 *                       type: string
 *                     jenis_kelamin:
 *                       type: string
 *                     nama_wali:
 *                       type: string
 *                     no_wali:
 *                       type: string
 *                     tanggal_lahir:
 *                       type: string
 *                       format: date
 *                     status:
 *                       type: string
 *                     roles:
 *                       type: array
 *                       items:
 *                         type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *             example:
 *               success: true
 *               message: "Berhasil mengambil profil"
 *               data:
 *                 id: 7
 *                 name: "Pelatih Satu"
 *                 email: "pelatih.satu@gmail.com"
 *                 phone: "081234567890"
 *                 foto: "uploads/users/foto-1234567890.jpg"
 *                 alamat: "Jl. Merdeka No. 10, Salatiga"
 *                 jenis_kelamin: "laki-laki"
 *                 nama_wali: null
 *                 no_wali: null
 *                 tanggal_lahir: "1990-01-10"
 *                 status: "active"
 *                 roles: ["pelatih"]
 *                 created_at: "2026-06-16T17:56:26.000Z"
 *                 updated_at: "2026-06-28T10:00:00.000Z"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User tidak ditemukan
 *       500:
 *         description: Server error
 */
router.get("/profile", verifyToken, getProfile);

module.exports = router;
