const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middlewares/authJwt");
const { authorizeRole } = require("../../middlewares/roleAdmin");

const {
  getGroups,
} = require("../../controllers/admin/pengumuman/whatsappContoller");
const {
  sendTest,
} = require("../../controllers/admin/pengumuman/tesSendController");
const {
  addBulkWhatsappGroup,
} = require("../../controllers/admin/pengumuman/addBulkWhatsappGroupController");
const {
  createPengumuman,
} = require("../../controllers/admin/pengumuman/createPengumumanController");
const {
  getAllPengumuman,
} = require("../../controllers/admin/pengumuman/getAllPengumumanController");
const {
  getPengumumanById,
} = require("../../controllers/admin/pengumuman/getPengumumanByIdController");
const {
  getDraftPengumuman,
} = require("../../controllers/admin/pengumuman/getDraftPengumumanController");

/**
 * @swagger
 * /api/whatsapp/groups:
 *   get:
 *     tags: [Admin - Pengumuman]
 *     summary: Mendapatkan daftar grup WhatsApp
 *     description: Mengambil seluruh grup WhatsApp yang diikuti oleh akun bot WhatsApp yang sedang aktif.
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar grup
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: ID grup WhatsApp
 *                     example: "120363123456789@g.us"
 *                   name:
 *                     type: string
 *                     description: Nama grup WhatsApp
 *                     example: "Pelatih Dojang"
 *       500:
 *         description: Gagal mengambil daftar grup
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to get groups"
 */
router.get("/whatsapp/groups", getGroups);

/**
 * @swagger
 * /api/admin/whatsapp/groups/bulk:
 *   post:
 *     summary: Tambah banyak grup WhatsApp sekaligus
 *     tags: [Admin - Pengumuman]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - groups
 *             properties:
 *               groups:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - group_jid
 *                     - nama_grup
 *                   properties:
 *                     group_jid:
 *                       type: string
 *                     nama_grup:
 *                       type: string
 *                     kelas_id:
 *                       type: integer
 *                       nullable: true
 *     responses:
 *       201:
 *         description: Proses selesai
 *       400:
 *         description: Input tidak valid
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.post("/whatsapp/groups/bulk", verifyToken, addBulkWhatsappGroup);

/**
 * @swagger
 * /api/admin/whatsapp/send-test:
 *   post:
 *     tags: [Admin - Pengumuman]
 *     summary: Kirim pesan test ke grup WhatsApp
 *     description: Endpoint untuk menguji pengiriman pesan WhatsApp ke grup tertentu.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - groupId
 *               - message
 *             properties:
 *               groupId:
 *                 type: string
 *                 example: "120363123456789@g.us"
 *               message:
 *                 type: string
 *                 example: "🚀 Test pengiriman dari sistem"
 *     responses:
 *       200:
 *         description: Pesan berhasil dikirim
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Data request tidak valid
 *       500:
 *         description: Gagal mengirim pesan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Failed to send message"
 */
router.post("/whatsapp/send-test", sendTest);

/**
 * @swagger
 * /api/admin/pengumuman:
 *   post:
 *     summary: Buat pengumuman baru (draft, terjadwal, atau langsung kirim)
 *     description: |
 *       Membuat pengumuman dengan tiga opsi status:
 *       - **draft**: hanya simpan, tidak dikirim
 *       - **terjadwal**: simpan dengan scheduled_at, akan diproses oleh cron
 *       - **terkirim**: langsung kirim notifikasi in-app dan WhatsApp (jika diaktifkan)
 *
 *       **Target Type:**
 *       - `global`: semua user aktif
 *       - `role`: berdasarkan role (murid/pelatih)
 *       - `kelas`: berdasarkan kelas_id
 *       - `individu`: berdasarkan daftar user_ids
 *     tags: [Admin - Pengumuman]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - judul
 *               - isi
 *               - target_type
 *             properties:
 *               judul:
 *                 type: string
 *                 description: Judul pengumuman
 *               isi:
 *                 type: string
 *                 description: Isi pengumuman (bisa menggunakan markdown atau plain text)
 *               target_type:
 *                 type: string
 *                 enum: [global, role, kelas, individu]
 *                 description: Jenis target penerima
 *               target_role:
 *                 type: string
 *                 enum: [semua, murid, pelatih]
 *                 description: Wajib jika target_type = role
 *               kelas_id:
 *                 type: integer
 *                 description: Wajib jika target_type = kelas
 *               user_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Wajib jika target_type = individu
 *               status:
 *                 type: string
 *                 enum: [draft, terjadwal, terkirim]
 *                 default: draft
 *                 description: Status pengumuman
 *               scheduled_at:
 *                 type: string
 *                 format: date-time
 *                 description: Wajib jika status = terjadwal (harus lebih besar dari waktu sekarang)
 *               kirim_whatsapp:
 *                 type: boolean
 *                 default: false
 *                 description: Kirim via WhatsApp (hanya untuk target_type = global)
 *               whatsapp_scope:
 *                 type: string
 *                 enum: [grup_besar_saja, semua_grup]
 *                 description: Wajib jika kirim_whatsapp = true (scope grup yang dikirim)
 *           examples:
 *             draft:
 *               summary: Draft (disimpan, tidak dikirim)
 *               value:
 *                 judul: "Pengumuman Latihan - Draft"
 *                 isi: "Ini adalah draft pengumuman yang belum dikirim."
 *                 target_type: "global"
 *                 status: "draft"
 *             terjadwal_role:
 *               summary: Terjadwal untuk role murid
 *               value:
 *                 judul: "Jadwal Ujian Sabuk Periode Juli"
 *                 isi: "Ujian sabuk akan dilaksanakan pada tanggal 15 Juli 2026. Silakan daftar melalui admin kelas masing-masing."
 *                 target_type: "role"
 *                 target_role: "murid"
 *                 status: "terjadwal"
 *                 scheduled_at: "2026-07-10 08:00:00"
 *             terjadwal_kelas:
 *               summary: Terjadwal untuk kelas tertentu
 *               value:
 *                 judul: "Libur Kelas Pemula"
 *                 isi: "Kelas Taekwondo Pemula libur pada tanggal 17 Agustus 2026. Selamat merayakan Hari Kemerdekaan!"
 *                 target_type: "kelas"
 *                 kelas_id: 3
 *                 status: "terjadwal"
 *                 scheduled_at: "2026-08-16 18:00:00"
 *             terjadwal_individu:
 *               summary: Terjadwal untuk individu tertentu
 *               value:
 *                 judul: "Pemberitahuan Khusus"
 *                 isi: "Anda dipilih untuk mengikuti seleksi tim provinsi. Silakan hubungi pelatih."
 *                 target_type: "individu"
 *                 user_ids: [26, 27]
 *                 status: "terjadwal"
 *                 scheduled_at: "2026-06-20 09:00:00"
 *             terkirim_global_with_whatsapp:
 *               summary: Langsung kirim ke semua user dan WhatsApp ke semua grup
 *               value:
 *                 judul: "PENGUMUMAN PENTING: Perubahan Jadwal"
 *                 isi: "Jadwal latihan rutin berubah. Hari Senin pukul 16.00 WIB menjadi pukul 15.30 WIB."
 *                 target_type: "global"
 *                 status: "terkirim"
 *                 kirim_whatsapp: true
 *                 whatsapp_scope: "semua_grup"
 *             terkirim_role:
 *               summary: Langsung kirim ke role pelatih
 *               value:
 *                 judul: "Rapat Koordinasi Pelatih"
 *                 isi: "Diumumkan rapat koordinasi pelatih akan dilaksanakan pada hari Sabtu, 20 Juni 2026 pukul 09.00 WIB di Dojang Utama."
 *                 target_type: "role"
 *                 target_role: "pelatih"
 *                 status: "terkirim"
 *     responses:
 *       201:
 *         description: Pengumuman berhasil dibuat
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     status:
 *                       type: string
 *                     scheduled_at:
 *                       type: string
 *                       nullable: true
 *       400:
 *         description: Validasi gagal
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.post("/pengumuman", verifyToken, createPengumuman);

/**
 * @swagger
 * /api/admin/pengumuman:
 *   get:
 *     summary: Ambil semua pengumuman dengan filter dan pagination, serta summary per status
 *     tags: [Admin - Pengumuman]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, enum: [10,25,50,75,100,200], default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Cari berdasarkan judul atau isi
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [draft, terjadwal, terkirim] }
 *         description: Filter status (hanya untuk data, tidak mempengaruhi summary)
 *       - in: query
 *         name: target_type
 *         schema: { type: string, enum: [global, role, kelas, individu] }
 *     responses:
 *       200:
 *         description: Berhasil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 summary:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     draft:
 *                       type: integer
 *                     terjadwal:
 *                       type: integer
 *                     terkirim:
 *                       type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Pengumuman'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get("/pengumuman", verifyToken, getAllPengumuman);

/**
 * @swagger
 * /api/admin/pengumuman/draft:
 *   get:
 *     summary: Ambil daftar pengumuman dengan status draft (diurutkan dari yang paling lama)
 *     tags: [Admin - Pengumuman]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, enum: [10,25,50,75,100,200], default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Cari berdasarkan judul atau isi
 *     responses:
 *       200:
 *         description: Berhasil
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PengumumanDraft'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 *
 * components:
 *   schemas:
 *     PengumumanDraft:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         judul:
 *           type: string
 *         isi:
 *           type: string
 *         target:
 *           type: object
 *           properties:
 *             target_type:
 *               type: string
 *             target_role:
 *               type: string
 *               nullable: true
 *             kelas_id:
 *               type: integer
 *               nullable: true
 *             target_user_ids:
 *               type: array
 *               items:
 *                 type: integer
 *               nullable: true
 *         status:
 *           type: string
 *         scheduled_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         kirim_whatsapp:
 *           type: boolean
 *         created_at:
 *           type: string
 *           format: date-time
 *         dibuat_oleh:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             nama:
 *               type: string
 */
router.get("/pengumuman/draft", verifyToken, getDraftPengumuman);

/**
 * @swagger
 * /api/admin/pengumuman/{id}:
 *   get:
 *     summary: Ambil detail pengumuman berdasarkan ID
 *     tags: [Admin - Pengumuman]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detail pengumuman
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
 *                     judul:
 *                       type: string
 *                     isi:
 *                       type: string
 *                     target:
 *                       type: object
 *                       properties:
 *                         target_type:
 *                           type: string
 *                         target_role:
 *                           type: string
 *                           nullable: true
 *                         kelas_id:
 *                           type: integer
 *                           nullable: true
 *                         target_user_ids:
 *                           type: array
 *                           items:
 *                             type: integer
 *                           nullable: true
 *                     status:
 *                       type: string
 *                     tanggal_publish:
 *                       type: string
 *                       format: date
 *                       nullable: true
 *                     scheduled_at:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     kirim_whatsapp:
 *                       type: boolean
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     dibuat_oleh:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         nama:
 *                           type: string
 *                     whatsapp:
 *                       type: object
 *                       properties:
 *                         dikirim:
 *                           type: boolean
 *                         statistik:
 *                           type: object
 *                           properties:
 *                             total_grup:
 *                               type: integer
 *                             terkirim:
 *                               type: integer
 *                             gagal:
 *                               type: integer
 *                             pending:
 *                               type: integer
 *                         daftar_grup:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               nama_grup:
 *                                 type: string
 *                               group_jid:
 *                                 type: string
 *                               status:
 *                                 type: string
 *                               sent_at:
 *                                 type: string
 *                                 format: date-time
 *                                 nullable: true
 *                               error_message:
 *                                 type: string
 *                                 nullable: true
 *       404:
 *         description: Pengumuman tidak ditemukan
 *       500:
 *         description: Server error
 */
router.get("/pengumuman/:id", verifyToken, getPengumumanById);

module.exports = router;
