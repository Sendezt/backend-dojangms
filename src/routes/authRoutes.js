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
const {
  getProfile,
  updateProfile,
} = require("../controllers/auth/profileController");
const { getPendingUsers } = require("../controllers/auth/pendingController");
const {
  getPendingUserDetail,
} = require("../controllers/auth/getPendingUserDetailController");
const { activateUser } = require("../controllers/auth/activateController");

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

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update profil user (tanpa password)
 *     description: |
 *       Update data profil user. Password tidak bisa diubah di sini – gunakan endpoint reset password.
 *       Semua field opsional, minimal satu field harus dikirim.
 *       Untuk upload foto, gunakan `multipart/form-data`.
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
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               phone:
 *                 type: string
 *                 example: "081234567890"
 *               alamat:
 *                 type: string
 *                 example: "Jl. Merdeka No. 10, Salatiga"
 *               jenis_kelamin:
 *                 type: string
 *                 enum: [laki-laki, perempuan]
 *                 example: "laki-laki"
 *               nama_wali:
 *                 type: string
 *                 example: "Budi Santoso"
 *               no_wali:
 *                 type: string
 *                 example: "082345678901"
 *               foto:
 *                 type: string
 *                 format: binary
 *                 description: File foto profil (opsional)
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               alamat:
 *                 type: string
 *               jenis_kelamin:
 *                 type: string
 *                 enum: [laki-laki, perempuan]
 *               nama_wali:
 *                 type: string
 *               no_wali:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profil berhasil diperbarui
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
 *                     status:
 *                       type: string
 *                     roles:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Tidak ada data yang diupdate atau validasi gagal
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User tidak ditemukan
 *       409:
 *         description: Email sudah digunakan
 *       500:
 *         description: Server error
 */
router.put("/profile", verifyToken, upload.single("foto"), updateProfile);

/**
 * @swagger
 * /api/auth/user-pending:
 *   get:
 *     summary: Daftar user pending (murid dengan status inactive) yang menunggu aktivasi admin
 *     description: |
 *       Menampilkan semua user dengan role `murid` dan status `inactive` yang belum diaktivasi oleh admin.
 *       Mendukung pagination dan pencarian berdasarkan nama, email, atau telepon.
 *
 *       **Akses:** Hanya admin yang dapat mengakses endpoint ini.
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Halaman yang diminta
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           enum: [10, 25, 50, 75, 100, 200]
 *           default: 10
 *         description: Jumlah data per halaman
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Cari berdasarkan nama, email, atau nomor telepon
 *         example: "Budi"
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar pending users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Berhasil mengambil daftar pending"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 5
 *                       name:
 *                         type: string
 *                         example: "Budi Santoso"
 *                       email:
 *                         type: string
 *                         example: "budi@example.com"
 *                       phone:
 *                         type: string
 *                         example: "081234567890"
 *                       tanggal_lahir:
 *                         type: string
 *                         format: date
 *                         example: "2010-05-10"
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-06-29 10:30:00"
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     current_page:
 *                       type: integer
 *                       example: 1
 *                     per_page:
 *                       type: integer
 *                       example: 10
 *                     total_page:
 *                       type: integer
 *                       example: 3
 *                     total_data:
 *                       type: integer
 *                       example: 25
 *                     has_next:
 *                       type: boolean
 *                       example: true
 *                     has_prev:
 *                       type: boolean
 *                       example: false
 *             example:
 *               success: true
 *               message: "Berhasil mengambil daftar pending"
 *               data:
 *                 - id: 5
 *                   name: "Budi Santoso"
 *                   email: "budi@example.com"
 *                   phone: "081234567890"
 *                   tanggal_lahir: "2010-05-10"
 *                   created_at: "2026-06-29 10:30:00"
 *                 - id: 7
 *                   name: "Siti Aminah"
 *                   email: "siti@example.com"
 *                   phone: "081234567891"
 *                   tanggal_lahir: "2011-08-15"
 *                   created_at: "2026-06-29 11:00:00"
 *               pagination:
 *                 current_page: 1
 *                 per_page: 10
 *                 total_page: 1
 *                 total_data: 2
 *                 has_next: false
 *                 has_prev: false
 *       401:
 *         description: Unauthorized (token tidak valid atau tidak ditemukan)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Unauthorized"
 *       403:
 *         description: Forbidden (user bukan admin)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Akses ditolak"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Gagal mengambil pending users"
 *               error: "Database connection error"
 */
router.get("/user-pending", verifyToken, getPendingUsers);

/**
 * @swagger
 * /api/auth/user-pending/{id}:
 *   get:
 *     summary: Detail user pending berdasarkan ID
 *     description: |
 *       Menampilkan detail lengkap dari user dengan role `murid` dan status `pending`.
 *       Data yang ditampilkan mencakup informasi pribadi, alamat, wali, dan sabuk saat ini (jika ada).
 *
 *       **Akses:** Hanya admin.
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID user pending
 *         example: 5
 *     responses:
 *       200:
 *         description: Berhasil mengambil detail user pending
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Detail user pending berhasil diambil"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 5
 *                     name:
 *                       type: string
 *                       example: "Budi Santoso"
 *                     email:
 *                       type: string
 *                       example: "budi@example.com"
 *                     phone:
 *                       type: string
 *                       example: "081234567890"
 *                     alamat:
 *                       type: string
 *                       example: "Jl. Merdeka No. 10, Salatiga"
 *                     jenis_kelamin:
 *                       type: string
 *                       enum: [laki-laki, perempuan]
 *                       example: "laki-laki"
 *                     nama_wali:
 *                       type: string
 *                       example: "Siti Aminah"
 *                     no_wali:
 *                       type: string
 *                       example: "081234567891"
 *                     tanggal_lahir:
 *                       type: string
 *                       format: date
 *                       example: "2010-05-10"
 *                     tahun_lahir:
 *                       type: integer
 *                       example: 2010
 *                     status:
 *                       type: string
 *                       example: "pending"
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-06-29 10:30:00"
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-06-29 10:30:00"
 *                     sabuk_saat_ini:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         name:
 *                           type: string
 *                           example: "Putih"
 *       400:
 *         description: ID user tidak valid (bukan angka atau < 1)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User pending tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (bukan admin)
 *       500:
 *         description: Server error
 */
router.get("/user-pending/:id", verifyToken, getPendingUserDetail);

/**
 * @swagger
 * /api/auth/approve/{id}:
 *   put:
 *     summary: Aktivasi akun user (pending → active) dan kirim WhatsApp
 *     description: |
 *       Endpoint ini digunakan oleh admin untuk mengaktivasi user yang baru mendaftar (status inactive).
 *       Setelah aktivasi, status user berubah menjadi active dan sistem akan mengirim pesan WhatsApp
 *       ke nomor telepon user sebagai notifikasi.
 *
 *       **Catatan:**
 *       - Hanya user dengan role `murid` dan status `inactive` yang bisa diaktivasi.
 *       - WhatsApp akan dikirim secara otomatis jika nomor telepon terisi.
 *       - Jika nomor telepon null, kirim WhatsApp akan dilewati (tapi user tetap aktif).
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID user yang akan diaktivasi
 *         example: 5
 *     responses:
 *       200:
 *         description: User berhasil diaktifkan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User berhasil diaktifkan dan WhatsApp telah dikirim"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 5
 *                     name:
 *                       type: string
 *                       example: "Budi Santoso"
 *                     email:
 *                       type: string
 *                       example: "budi@example.com"
 *                     phone:
 *                       type: string
 *                       example: "081234567890"
 *                     status:
 *                       type: string
 *                       example: "active"
 *       400:
 *         description: ID user tidak valid (bukan angka atau < 1)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User pending tidak ditemukan (tidak ada user dengan role murid dan status inactive)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error (misal koneksi database, WhatsApp gagal, dsb)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put("/approve/:id", verifyToken, activateUser);

module.exports = router;
