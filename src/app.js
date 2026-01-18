const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();

const userRouter = require("./routes/adminRoutes");
const authRouter = require("./routes/authRoutes");

// Middleware
app.use(cors());
app.use(express.json());

// Localhost
app.get("/", (req, res) => {
  res.json({
    status: true,
    message: "Server is running",
    endpoint: ["/api/auth", "/api/admin"],
  });
});

// Routes
app.use("/api/admin", userRouter);
app.use("/api/auth", authRouter);

module.exports = app;
