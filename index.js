const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

// ------------------
// Track bot status
// ------------------
let latestQRCode = null;
let isReady = false;

// ------------------
// WhatsApp client with persistent session
// ------------------
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: 'bot2', // Change to bot2, bot3 for multiple numbers
        dataPath: '/mnt/data/.wwebjs_auth' // Persistent disk for Render
    }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// ------------------
// QR code event
// ------------------
client.on('qr', async qr => {
    latestQRCode = await qrcode.toDataURL(qr);
    isReady = false;
    console.log('✅ QR Code generated — scan it in the browser to log in.');
});

// ------------------
// Ready event
// ------------------
client.on('ready', () => {
    console.log('🤖 WhatsApp bot is ready and connected!');
    isReady = true;
});

// ------------------
// Handle disconnection & auto-reconnect
// ------------------
client.on('disconnected', reason => {
    console.log(`⚠️ Disconnected due to: ${reason}`);
    isReady = false;
    console.log('♻️ Reinitializing client in 5 seconds...');
    setTimeout(() => client.initialize(), 5000);
});

// ------------------
// Message handler: reactive auto-reply
// ------------------
client.on('message', async msg => {
    console.log(`📩 Message received from ${msg.from}: ${msg.body}`);

    // Auto-reply text
    const replyMessage = 'Hello! 👋 Thanks for messaging IBETIN. We will get back to you shortly.';

    try {
        await msg.reply(replyMessage);
        console.log(`✅ Auto-reply sent to ${msg.from}`);
    } catch (err) {
        console.error(`❌ Failed to send auto-reply to ${msg.from}:`, err);
    }
});

// ------------------
// Initialize client
// ------------------
client.initialize();

// ------------------
// Express route for QR/status
// ------------------
app.get('/', (req, res) => {
    const html = `
        <meta http-equiv="refresh" content="5">
        <style>
            body { font-family: Arial, sans-serif; text-align: center; padding-top: 50px; }
            img { width: 250px; margin-top: 20px; }
            .status { font-size: 1.2rem; margin-top: 10px; }
        </style>
        <h1>WhatsApp API Status</h1>
        ${
            !isReady && latestQRCode
                ? `<div class="status">📱 Waiting for WhatsApp login...</div><img src="${latestQRCode}" alt="QR Code" />`
                : isReady
                ? `<div class="status">✅ Connected to WhatsApp successfully!</div>`
                : `<div class="status">⏳ Initializing, please wait...</div>`
        }
    `;
    res.send(html);
});

// ------------------
// Start Express server
// ------------------
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Server running on port ${PORT}`);
});

