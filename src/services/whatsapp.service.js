// src/services/whatsapp.service.js
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

let isReady = false;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

client.on("qr", (qr) => {
  console.log("Scan QR berikut:");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("WhatsApp Ready");
  isReady = true;
});

client.on("authenticated", () => {
  console.log("WhatsApp Authenticated");
});

client.on("auth_failure", (msg) => {
  console.error("Auth Failure", msg);
});

// Fungsi untuk mengirim pesan dengan pengecekan status
async function sendMessage(groupId, message) {
  if (!isReady) {
    console.warn("⚠️ WhatsApp client belum siap. Pesan tidak dikirim.");
    return {
      success: false,
      error: "WhatsApp client not ready",
    };
  }
  try {
    await client.sendMessage(groupId, message);
    console.log(`✅ Pesan terkirim ke ${groupId}`);
    return {
      success: true,
    };
  } catch (error) {
    console.error(`❌ Gagal kirim ke ${groupId}:`, error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Ekspor status client
function isClientReady() {
  return isReady;
}

client.initialize();

module.exports = {
  client,
  sendMessage,
  isClientReady,
};
