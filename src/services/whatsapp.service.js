const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

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
});

client.on("authenticated", () => {
  console.log("WhatsApp Authenticated");
});

client.on("auth_failure", (msg) => {
  console.error("Auth Failure", msg);
});

async function sendMessage(groupId, message) {
  try {
    await client.sendMessage(groupId, message);

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

client.initialize();

module.exports = {
  client,
  sendMessage,
};
