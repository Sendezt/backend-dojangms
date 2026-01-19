const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();

const adminRouter = require("./routes/adminRoutes");
const authRouter = require("./routes/authRoutes");
const publicRouter = require("./routes/publicRoutes");

// Middleware
app.use(cors());
app.use(express.json());

// Localhost
app.get("/", (req, res) => {
  res.json({
    status: true,
    message: "Server is running",
    endpoint: ["/api/auth", "/api/admin", "/api/public"],
  });
});

// Routes
app.use("/api/admin", adminRouter);
app.use("/api/auth", authRouter);
app.use("/api/public", publicRouter);

module.exports = app;
