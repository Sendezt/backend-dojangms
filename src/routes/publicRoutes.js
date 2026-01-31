const express = require("express");
const router = express.Router();

// Belt
const { getAllBelts } = require("../controllers/public/GetAllBeltController");

// role routes
router.get("/get/belt", getAllBelts);

module.exports = router;
