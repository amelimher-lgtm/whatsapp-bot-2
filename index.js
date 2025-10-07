const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

// ------------------
// Step 1: Track bot status
// ------------------
let latestQRCode = null;
let isReady = false;

// ------------------
// Step 2: WhatsApp client with persistent session (Render compatible)
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
// Step 3: QR code received
// ------------------
client.on('qr', async qr => {
    latestQRCode = await qrcode.toDataURL(qr);
    isReady = false;
    console.log('✅ QR Code generated — scan it in the browser to log in.');
});

// ------------------
// Step 4: Client ready
// ------------------
client.on('ready', () => {
    console.log('🤖 WhatsApp bot is ready and connected!');
    isReady = true;
});

// ------------------
// Step 5: Handle disconnection and auto-reconnect
// ------------------
client.on('disconnected', reason => {
    console.log(`⚠️ Disconnected due to: ${reason}`);
    isReady = false;
    console.log('♻️ Attempting to reinitialize client...');
    setTimeout(() => {
        client.initialize();
    }, 5000); // Wait 5 seconds before reconnect
});

// ------------------
// Step 6: Message handler
// ------------------
client.on('message', msg => {
    console.log(`📩 Message received: ${msg.body}`);
    if (msg.body.toLowerCase() === 'hi') {
        msg.reply('Hello! 👋 Welcome to IBETIN.');
    }
});

// ------------------
// Step 7: Initialize client
// ------------------
client.initialize();

// ------------------
// Step 8: Browser QR/Status route
// ------------------
app.get('/', (req, res) => {
    let html = `
        <meta http-equiv="refresh" content="5">
        <style>
            body { font-family: Arial, sans-serif; text-align: center; padding-top: 50px; }
            img { width: 250px; margin-top: 20px; }
            .status { font-size: 1.2rem; margin-top: 10px; }
        </style>
        <h1>WhatsApp API Status</h1>
    `;

    if (latestQRCode && !isReady) {
        html += `
            <div class="status">📱 Waiting for WhatsApp login...</div>
            <img src="${latestQRCode}" alt="QR Code" />
        `;
    } else if (isReady) {
        html += `<div class="status">✅ Connected to WhatsApp successfully!</div>`;
    } else {
        html += `<div class="status">⏳ Initializing, please wait...</div>`;
    }

    res.send(html);
});

// ------------------
// Step 9: Start Express server
// ------------------
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Server running on port ${PORT}`);
});



