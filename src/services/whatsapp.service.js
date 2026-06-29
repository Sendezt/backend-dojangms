// src/services/whatsapp.service.js
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

// ============================================================
// KONFIGURASI SESSION
// ============================================================
const SESSION_DIR = path.join(__dirname, "../../.wwebjs_auth/session-dojangms");

// ============================================================
// FUNGSI DELETE SESSION (untuk mengatasi EBUSY / lockfile)
// ============================================================
function deleteSessionFolder() {
  try {
    if (fs.existsSync(SESSION_DIR)) {
      fs.rmSync(SESSION_DIR, { recursive: true, force: true });
      console.log("🗑️ Session folder deleted successfully.");
    }
  } catch (err) {
    console.error("❌ Failed to delete session folder:", err.message);
  }
}

// ============================================================
// GENERATE QR BASE64
// ============================================================
async function generateQRBase64(qrData) {
  try {
    return await QRCode.toDataURL(qrData);
  } catch (err) {
    console.error("Gagal generate QR base64:", err);
    return null;
  }
}

// ============================================================
// INISIALISASI CLIENT
// ============================================================
let clientReady = false;
let qrCodeData = null;
let qrTimestamp = null;

const isProduction = process.env.NODE_ENV === "production";

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "dojangms",
  }),
  puppeteer: {
    headless: true,
    executablePath: "/usr/bin/google-chrome",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  },
});

// ============================================================
// EVENT HANDLER
// ============================================================

// QR Code
client.on("qr", async (qr) => {
  qrCodeData = qr;
  qrTimestamp = new Date().toISOString();
  console.log("📱 QR Code generated at:", qrTimestamp);
  console.log("Scan QR Code berikut:");
  qrcode.generate(qr, { small: true });
});

// Authenticated
client.on("authenticated", () => {
  console.log("✅ WhatsApp authenticated!");
  qrCodeData = null;
  qrTimestamp = null;
});

// Ready
client.on("ready", () => {
  clientReady = true;
  console.log("🚀 WhatsApp Client is ready!");
});

// Disconnected (KRITIS: tangani logout)
client.on("disconnected", async (reason) => {
  clientReady = false;
  console.log("⚠️ WhatsApp disconnected:", reason);

  if (reason === "LOGOUT") {
    console.log("🔄 Logout detected. Deleting session and restarting...");
    deleteSessionFolder();

    // Exit process agar PM2 restart
    setTimeout(() => {
      console.log("💀 Exiting process to trigger PM2 restart...");
      process.exit(1);
    }, 2000);
  } else {
    // Untuk disconnect lain (misal network error), coba restart client tanpa hapus session
    console.log("🔄 Attempting to restart client...");
    try {
      await client.initialize();
    } catch (err) {
      console.error("❌ Failed to restart client:", err.message);
    }
  }
});

// Auth Failure
client.on("auth_failure", (msg) => {
  clientReady = false;
  console.error("❌ Auth failed:", msg);
  // Jika auth gagal, hapus session dan restart
  deleteSessionFolder();
  setTimeout(() => {
    console.log("🔄 Restarting client after auth failure...");
    process.exit(1);
  }, 2000);
});

// ============================================================
// MULAI CLIENT (dengan try-catch + retry)
// ============================================================
function startClient() {
  try {
    client.initialize();
  } catch (err) {
    console.error("❌ Failed to initialize WhatsApp client:", err.message);
    if (err.message.includes("EBUSY") || err.message.includes("lockfile")) {
      console.log("🔓 Lock file detected. Deleting session and retrying...");
      deleteSessionFolder();
      setTimeout(() => {
        console.log("🔄 Retrying client initialization...");
        client.initialize();
      }, 3000);
    }
  }
}

startClient();

// ============================================================
// CLEANUP ON EXIT
// ============================================================
process.on("exit", () => {
  if (client && client.pupBrowser) {
    client.pupBrowser.close().catch(() => {});
  }
});

process.on("SIGINT", async () => {
  console.log("🛑 Received SIGINT. Closing client...");
  if (client) {
    try {
      await client.destroy();
    } catch (e) {
      // ignore
    }
  }
  process.exit(0);
});

// ============================================================
// EKSPOR FUNGSI
// ============================================================

function isClientReady() {
  return clientReady;
}

async function getWhatsappStatus() {
  if (clientReady) {
    return {
      connected: true,
      qrCode: null,
      message: "WhatsApp terhubung",
    };
  }
  if (qrCodeData) {
    const base64 = await generateQRBase64(qrCodeData);
    return {
      connected: false,
      qrCode: base64,
      timestamp: qrTimestamp,
      message: "Silakan scan QR Code",
    };
  }
  return {
    connected: false,
    qrCode: null,
    message: "Menunggu QR Code...",
  };
}

async function sendMessage(phone, message) {
  if (!clientReady) throw new Error("WhatsApp client belum siap.");
  const chatId = `${phone}@c.us`;
  return client.sendMessage(chatId, message);
}

async function sendDocument(phone, filePath, caption = "") {
  if (!clientReady) throw new Error("WhatsApp client belum siap.");
  const chatId = `${phone}@c.us`;
  const media = MessageMedia.fromFilePath(filePath);
  return client.sendMessage(chatId, media, { caption });
}

async function sendMessageWithDocument(phone, message, filePath) {
  await sendMessage(phone, message);
  return sendDocument(phone, filePath);
}

async function getChats() {
  if (!clientReady) throw new Error("WhatsApp client belum siap.");
  return await client.getChats();
}

// ============================================================
// [BARU] FUNGSI CEK NOMOR TERDAFTAR
// ============================================================
async function isPhoneRegistered(phone, timeout = 15000) {
  if (!clientReady) {
    throw new Error("WhatsApp client belum siap.");
  }
  // Bersihkan nomor: hanya angka, ubah 0 di depan menjadi 62 jika perlu
  let cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.startsWith("0")) {
    cleanPhone = "62" + cleanPhone.slice(1);
  }
  // Pastikan minimal 10 digit (contoh: 628123456789)
  if (cleanPhone.length < 10) {
    throw new Error("Nomor telepon tidak valid (minimal 10 digit).");
  }
  const numberId = `${cleanPhone}@c.us`;

  try {
    // Race dengan timeout agar tidak menggantung terlalu lama
    const result = await Promise.race([
      client.getNumberId(numberId),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout ${timeout}ms`)), timeout),
      ),
    ]);
    return !!result; // true jika terdaftar
  } catch (err) {
    throw new Error(`Gagal mengecek nomor: ${err.message}`);
  }
}

module.exports = {
  client,
  isClientReady,
  getWhatsappStatus,
  sendMessage,
  sendDocument,
  sendMessageWithDocument,
  getChats,
  isPhoneRegistered, // <-- ekspor fungsi baru
};
