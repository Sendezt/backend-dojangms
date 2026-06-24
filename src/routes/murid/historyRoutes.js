const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middlewares/authJwt");
const { authorizeRole } = require("../../middlewares/roleAdmin");

const {
  getPrestasiMurid,
} = require("../../controllers/murid/rekapPrestasi/prestasiController");
const {
  getStatistikPrestasi,
} = require("../../controllers/murid/rekapPrestasi/prestasiStatistikController");
const {
  getRiwayatUjianMurid,
} = require("../../controllers/murid/rekapPrestasi/ujianController");

/**
 * @swagger
 * /api/murid/prestasi:
 *   get:
 *     summary: Daftar semua prestasi/kejuaraan yang pernah diikuti murid (hasil terisi)
 *     description: |
 *       Menampilkan daftar kejuaraan yang pernah diikuti oleh murid yang sedang login,
 *       lengkap dengan detail kelas pertandingan (kategori usia, level, gender, label/jurus, dll).
 *       Hanya menampilkan data yang sudah memiliki hasil (hasil tidak null).
 *     tags: [Murid - History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Halaman
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
 *         description: Cari berdasarkan nama kejuaraan atau lokasi
 *         example: "Salatiga"
 *       - in: query
 *         name: tahun
 *         schema:
 *           type: integer
 *         description: Filter tahun kejuaraan
 *         example: 2026
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [kota, provinsi, nasional, internasional]
 *         description: Filter level kejuaraan
 *       - in: query
 *         name: hasil
 *         schema:
 *           type: string
 *           enum: [juara1, juara2, juara3, harapan1, harapan2, peserta]
 *         description: Filter hasil yang diperoleh
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar prestasi
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
 *                   example: "Berhasil mengambil daftar prestasi"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       kejuaraan_id:
 *                         type: integer
 *                         example: 1
 *                       kejuaraan_nama:
 *                         type: string
 *                         example: "Walikota Salatiga Taekwondo Championship 2026"
 *                       level:
 *                         type: string
 *                         enum: [kota, provinsi, nasional, internasional]
 *                         example: "kota"
 *                       location:
 *                         type: string
 *                         example: "GOR Kridanggo, Salatiga"
 *                       year:
 *                         type: integer
 *                         example: 2026
 *                       start_date:
 *                         type: string
 *                         format: date
 *                         example: "2026-06-19"
 *                       end_date:
 *                         type: string
 *                         format: date
 *                         example: "2026-06-21"
 *                       cabang:
 *                         type: string
 *                         enum: [kyorugi, poomsae]
 *                         example: "kyorugi"
 *                       hasil:
 *                         type: string
 *                         enum: [juara1, juara2, juara3, harapan1, harapan2, peserta]
 *                         example: "juara1"
 *                       catatan:
 *                         type: string
 *                         nullable: true
 *                         example: null
 *                       is_edited:
 *                         type: integer
 *                         example: 1
 *                       tanggal_daftar:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-06-19 10:00:00"
 *                       belt_saat_itu:
 *                         type: string
 *                         example: "Putih"
 *                       # Detail Kelas Pertandingan
 *                       kategori_usia:
 *                         type: string
 *                         nullable: true
 *                         example: "Cadet"
 *                       level_kompetisi:
 *                         type: string
 *                         nullable: true
 *                         enum: [festival, pemula, prestasi]
 *                         example: "pemula"
 *                       gender:
 *                         type: string
 *                         nullable: true
 *                         enum: [putra, putri]
 *                         example: "putra"
 *                       label_berat:
 *                         type: string
 *                         nullable: true
 *                         example: "under-42"
 *                       batas_bawah:
 *                         type: number
 *                         nullable: true
 *                         example: 35
 *                       batas_atas:
 *                         type: number
 *                         nullable: true
 *                         example: 42
 *                       jurus:
 *                         type: string
 *                         nullable: true
 *                         example: "Koryo"
 *                       format_poomsae:
 *                         type: string
 *                         nullable: true
 *                         example: "tunggal"
 *                       kelas_kejuaraan_detail:
 *                         type: string
 *                         nullable: true
 *                         example: "Cadet pemula under-42 putra"
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     current_page:
 *                       type: integer
 *                     per_page:
 *                       type: integer
 *                     total_page:
 *                       type: integer
 *                     total_data:
 *                       type: integer
 *                     has_next:
 *                       type: boolean
 *                     has_prev:
 *                       type: boolean
 *             example:
 *               success: true
 *               message: "Berhasil mengambil daftar prestasi"
 *               data:
 *                 - kejuaraan_id: 1
 *                   kejuaraan_nama: "Walikota Salatiga Taekwondo Championship 2026"
 *                   level: "kota"
 *                   location: "GOR Kridanggo, Salatiga"
 *                   year: 2026
 *                   start_date: "2026-06-19"
 *                   end_date: "2026-06-21"
 *                   cabang: "kyorugi"
 *                   hasil: "juara1"
 *                   catatan: null
 *                   is_edited: 1
 *                   tanggal_daftar: "2026-06-19 10:00:00"
 *                   belt_saat_itu: "Putih"
 *                   kategori_usia: "Cadet"
 *                   level_kompetisi: "pemula"
 *                   gender: "putra"
 *                   label_berat: "under-42"
 *                   batas_bawah: 35
 *                   batas_atas: 42
 *                   jurus: null
 *                   format_poomsae: null
 *                   kelas_kejuaraan_detail: "Cadet pemula under-42 putra"
 *               pagination:
 *                 current_page: 1
 *                 per_page: 10
 *                 total_page: 1
 *                 total_data: 1
 *                 has_next: false
 *                 has_prev: false
 *       400:
 *         description: Parameter tidak valid (level atau hasil tidak sesuai enum)
 *       401:
 *         description: Unauthorized (token tidak valid atau tidak ditemukan)
 *       500:
 *         description: Server error
 */
router.get("/prestasi", verifyToken, getPrestasiMurid);

/**
 * @swagger
 * /api/murid/prestasi/statistik:
 *   get:
 *     summary: Statistik prestasi murid (total juara, harapan, peserta)
 *     tags: [Murid - History]
 *     security:
 *       - bearerAuth: []
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_kejuaraan:
 *                       type: integer
 *                     juara1:
 *                       type: integer
 *                     juara2:
 *                       type: integer
 *                     juara3:
 *                       type: integer
 *                     harapan1:
 *                       type: integer
 *                     harapan2:
 *                       type: integer
 *                     peserta:
 *                       type: integer
 *       500:
 *         description: Server error
 */
router.get("/prestasi/statistik", verifyToken, getStatistikPrestasi);

/**
 * @swagger
 * /api/murid/riwayat-ujian:
 *   get:
 *     summary: Riwayat ujian sabuk murid (lengkap dengan alur sabuk)
 *     description: |
 *       Menampilkan semua ujian sabuk yang pernah diikuti oleh murid,
 *       serta alur perjalanan sabuk dari pertama kali hingga saat ini.
 *       - `riwayat_ujian`: daftar ujian dengan status kelulusan dan sabuk yang dicapai.
 *       - `alur_sabuk`: linimasa semua sabuk yang pernah dimiliki.
 *     tags: [Murid - History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           enum: [10, 25, 50, 75, 100, 200]
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [terdaftar, lulus, tidak_lulus]
 *         description: Filter berdasarkan status ujian
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
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total_ujian:
 *                           type: integer
 *                         lulus:
 *                           type: integer
 *                         tidak_lulus:
 *                           type: integer
 *                         terdaftar:
 *                           type: integer
 *                         sabuk_saat_ini:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             nama:
 *                               type: string
 *                             achieved_at:
 *                               type: string
 *                               format: date
 *                     riwayat_ujian:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           peserta_ujian_id:
 *                             type: integer
 *                           ujian:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               level:
 *                                 type: string
 *                               lokasi:
 *                                 type: string
 *                               keterangan:
 *                                 type: string
 *                               tanggal_mulai:
 *                                 type: string
 *                                 format: date
 *                               tanggal_selesai:
 *                                 type: string
 *                                 format: date
 *                           status:
 *                             type: string
 *                           tanggal_lulus:
 *                             type: string
 *                             format: date-time
 *                           tanggal_edit:
 *                             type: string
 *                             format: date-time
 *                           belt_asal:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               nama:
 *                                 type: string
 *                           belt_tujuan:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               nama:
 *                                 type: string
 *                     alur_sabuk:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           belt_id:
 *                             type: integer
 *                           nama:
 *                             type: string
 *                           achieved_at:
 *                             type: string
 *                             format: date
 *                           is_current:
 *                             type: boolean
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/riwayat-ujian", verifyToken, getRiwayatUjianMurid);

module.exports = router;
