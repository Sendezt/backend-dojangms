// src\services\whatsapp.service.js
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

const QRCode = require("qrcode");

let currentQr = null;
let currentStatus = "initializing";

let client = null;
let isReady = false;
let isInitializing = false;

function createClient() {
  console.log("[WA] Creating WhatsApp Client...");

  client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-extensions",
        "--disable-background-networking",
        "--no-first-run",
        "--no-default-browser-check",
      ],
    },
  });

  client.on("qr", async (qr) => {
    console.log("[WA] QR Received");

    currentStatus = "qr";

    currentQr = await QRCode.toDataURL(qr);
  });

  client.on("authenticated", () => {
    console.log("[WA] Authenticated");

    currentStatus = "authenticated";
  });

  client.on("ready", () => {
    console.log("[WA] Ready");
    isReady = true;
    isInitializing = false;
    currentStatus = "ready";
    currentQr = null;
  });

  client.on("loading_screen", (percent, message) => {
    console.log(`[WA] Loading ${percent}% - ${message}`);
  });

  client.on("change_state", (state) => {
    console.log("[WA] State:", state);
  });

  client.on("disconnected", async (reason) => {
    currentStatus = "disconnected";
    currentQr = null;
    console.error("[WA] Disconnected:", reason);

    isReady = false;

    try {
      await client.destroy();
    } catch (err) {
      console.error("[WA] Destroy Error:", err.message);
    }

    setTimeout(() => {
      console.log("[WA] Reconnecting...");
      initializeClient();
    }, 5000);
  });

  client.on("auth_failure", (msg) => {
    console.error("[WA] Auth Failure:", msg);
    currentStatus = "auth_failure";
    isReady = false;
  });
}

async function initializeClient() {
  if (isInitializing) return;

  isInitializing = true;

  if (!client) {
    createClient();
  }

  try {
    await client.initialize();
  } catch (err) {
    console.error("[WA] Initialize Failed:", err.message);

    isReady = false;
    isInitializing = false;

    setTimeout(() => {
      initializeClient();
    }, 5000);
  }
}

initializeClient();

function isClientReady() {
  return isReady && client && client.pupPage && !client.pupPage.isClosed();
}

async function getChats() {
  if (!isClientReady()) {
    throw new Error("WhatsApp client not ready");
  }

  try {
    return await client.getChats();
  } catch (err) {
    if (
      err.message.includes("detached Frame") ||
      err.message.includes("Execution context was destroyed")
    ) {
      console.warn("[WA] Browser context invalid, reconnecting...");

      isReady = false;

      try {
        await client.destroy();
      } catch {}

      client = null;

      initializeClient();

      throw new Error(
        "WhatsApp sedang reconnect, silakan coba beberapa detik lagi.",
      );
    }

    throw err;
  }
}

async function sendMessage(chatId, message) {
  if (!isClientReady()) {
    return {
      success: false,
      error: "WhatsApp client not ready",
    };
  }

  try {
    await client.sendMessage(chatId, message);

    return {
      success: true,
    };
  } catch (err) {
    if (
      err.message.includes("detached Frame") ||
      err.message.includes("Execution context was destroyed")
    ) {
      isReady = false;

      try {
        await client.destroy();
      } catch {}

      client = null;

      initializeClient();
    }

    return {
      success: false,
      error: err.message,
    };
  }
}

function getWhatsappStatus() {
  return {
    ready: isReady,
    status: currentStatus,
    qr: currentQr,
  };
}

module.exports = {
  get client() {
    return client;
  },
  initializeClient,
  getChats,
  sendMessage,
  isClientReady,
  getWhatsappStatus,
};
