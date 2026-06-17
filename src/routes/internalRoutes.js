const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/authJwt");

const {
  processScheduledAnnouncements,
} = require("../controllers/internal/processScheduledAnnouncementsController");

router.post("/pengumuman/process-scheduled", processScheduledAnnouncements);

module.exports = router;
