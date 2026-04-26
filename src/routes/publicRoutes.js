const express = require("express");
const router = express.Router();

// Belt
const { getAllBelts } = require("../controllers/public/GetAllBeltController");

/**
 * @swagger
 * tags:
 *   name: Public
 *   description: Public operations
 */

/**
 * @swagger
 * /api/public/get/belt:
 *   get:
 *     summary: Get all belts
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: A list of all belts
 */
// role routes
router.get("/get/belt", getAllBelts);

module.exports = router;
