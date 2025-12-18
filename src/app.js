const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const PORT = process.env.PORT;

const userRouter = require("./routes/userRoutes");

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/user", userRouter);

module.exports = app;
