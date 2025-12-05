const { Client, LocalAuth } = require("whatsapp-web.js");
const axios = require("axios");
const qrcode = require("qrcode-terminal");
const express = require("express");

// --- Express server for Render ---
const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("WhatsApp Bot is running!");
});

// --- WhatsApp Client Setup ---
const client = new Client({
  authStrategy: new LocalAuth(),
});

client.on("qr", (qr) => {
  console.log("Scan this QR code to connect WhatsApp:");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("WhatsApp Client is ready!");
});

// --- Function to respond to messages ---
async function respond_to_message(msg) {
  if (!msg.body) return;

  const data = {
    msg: msg.body,
    from: msg.from,
    from_name: msg._data.notifyName || "Unknown",
  };

  try {
    const response = await axios.post(
      "https://n8n.srv1114630.hstgr.cloud/webhook-test/real_estate_bot",
      data
    );

    if (response.data.output) {
      await msg.reply(response.data.output);
      console.log("Replied with:", response.data.output);
    } else {
      console.log("No response from n8n");
    }
  } catch (error) {
    console.error("Error calling n8n webhook:", error.message);
  }
}

// --- Bot message handler ---
client.on("message_create", async (msg) => {
  console.log("MESSAGE RECEIVED:", msg.body, "FROM:", msg.from);

  if (msg.id.fromMe) return; // Ignore messages sent by bot itself

  // Whitelisted numbers
  const white_list_responders = [
    "919905887725@c.us", 
    "917057758867@c.us", 
    "24636033122324@lid",
    "918252472186@c.us",
    "919508949406@c.us",
    "53270680723494@lid"
  ];

  if (msg.from.includes("@g.us")) {
    const mentionedIds = msg.mentionedIds || [];
    mentionedIds.forEach((id) => {
      if (
        white_list_responders.includes(id) &&
        white_list_responders.includes(msg.from)
      ) {
        respond_to_message(msg);
      }
    });
  } else {
    // Personal message
    if (white_list_responders.includes(msg.from)) {
      respond_to_message(msg);
    }
  }
});

// --- Initialize WhatsApp Client ---
client.initialize();

// --- Start Express server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
