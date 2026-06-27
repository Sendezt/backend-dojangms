// src/jobs/scheduler.js
const cron = require("node-cron");
const axios = require("axios");
require("dotenv").config();

// Jalankan setiap menit
cron.schedule("* * * * *", async () => {
  try {
    const response = await axios.post(
      "http://localhost:3001/api/internal/pengumuman/process-scheduled",
      {},
      {
        headers: {
          "x-internal-secret": process.env.INTERNAL_API_SECRET,
        },
        timeout: 30000,
      },
    );

    // Log jika ada pengumuman yang berhasil dikirim
    if (response.data.success) {
      console.log(
        `✅ [${new Date().toLocaleString("id-ID")}] ${response.data.message}`,
      );

      if (response.data.sent > 0) {
        console.log(
          `📢 Berhasil mengirim ${response.data.sent} pengumuman WhatsApp.`,
        );
      }
    }
  } catch (error) {
    console.error(
      `❌ [${new Date().toLocaleString("id-ID")}] Error:`,
      error.message,
    );

    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
  }
});

console.log(`🕒 Scheduler berjalan pada ${new Date().toLocaleString("id-ID")}`);
