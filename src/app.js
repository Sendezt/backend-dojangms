const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const app = express();

const kelolaJadwalRouter = require("./routes/admin/jadwalRoutes");
const kelolaKelasRouter = require("./routes/admin/kelasRoutes");
const kelolaAdminRouter = require("./routes/admin/adminRoutes");
const adminRouter = require("./routes/adminRoutes");
const latihanRouter = require("./routes/admin/latihanWajibRoutes");
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
app.use("/api/admin", latihanRouter);
app.use("/api/admin", sertifikasiRouter);
app.use("/api/admin", kelolaAdminRouter);
app.use("/api/admin", kelolaJadwalRouter);
app.use("/api/admin", kelolaKelasRouter);
app.use("/api/auth", authRouter);
app.use("/api/public", publicRouter);

module.exports = app;
