const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const app = express();
process.env.TZ = "Asia/Jakarta";

const JadwalMuridRouter = require("./routes/murid/jadwalRoutes");
const KelasMurid = require("./routes/murid/kelasRoutes");
const UjianPelatihRouter = require("./routes/pelatih/ujianKenaikanSabukRoutes");
const kejuaraanPelatihRouter = require("./routes/pelatih/kejuaraanRoutes");
const absensiPelatihRouter = require("./routes/pelatih/absensiRoutes");
const kelolaKelasbyPelatih = require("./routes/pelatih/kelasRoutes");
const cronjobRouter = require("./routes/internalRoutes");
const kelolaPengumuman = require("./routes/admin/pengumumanRoutes");
const kelolaUjianSabuk = require("./routes/admin/ujianSabukRoutes");
const kelolaKejuaraan = require("./routes/admin/kejuaraanRoutes");
const kelolaAbsensiRouter = require("./routes/admin/absensiRoutes");
const kelolaJadwalRouter = require("./routes/admin/jadwalRoutes");
const kelolaKelasRouter = require("./routes/admin/kelasRoutes");
const kelolaAdminRouter = require("./routes/admin/adminRoutes");
const adminRouter = require("./routes/adminRoutes");
const sertifikasiRouter = require("./routes/admin/sertifikasiRoutes");
const authRouter = require("./routes/authRoutes");
const publicRouter = require("./routes/publicRoutes");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Localhost
app.get("/", (req, res) => {
  res.json({
    status: true,
    message: "Server is running successfully, welcome to the API",
    endpoint: ["/api/auth", "/api/admin", "/api/public"],
  });
});

// Routes
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// Admin routes
app.use("/api/admin", adminRouter);
app.use("/api/admin", sertifikasiRouter);
app.use("/api/admin", kelolaAdminRouter);
app.use("/api/admin", kelolaJadwalRouter);
app.use("/api/admin", kelolaKelasRouter);
app.use("/api/admin", kelolaAbsensiRouter);
app.use("/api/admin", kelolaKejuaraan);
app.use("/api/admin", kelolaUjianSabuk);
app.use("/api/admin", kelolaPengumuman);
app.use("/api/pelatih", kelolaKelasbyPelatih);
app.use("/api/pelatih", absensiPelatihRouter);
app.use("/api/pelatih", kejuaraanPelatihRouter);
app.use("/api/pelatih", UjianPelatihRouter);
app.use("/api/murid", KelasMurid);
app.use("/api/murid", JadwalMuridRouter);
app.use("/api/auth", authRouter);
app.use("/api/public", publicRouter);
app.use("/api/internal", cronjobRouter);

module.exports = app;
