const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

// ------------------
// Step 1: Track bot status
// ------------------
let latestQRCode = null; // store QR code for browser
let isReady = false;     // track if bot is connected

// ------------------
// WhatsApp client with session
// ------------------
const client = new Client({
    authStrategy: new LocalAuth({ clientId: 'bot1' }),
    puppeteer: { headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] }
});

// ------------------
// QR code received
// ------------------
client.on('qr', async qr => {
    latestQRCode = await qrcode.toDataURL(qr);
    isReady = false; // still not connected
    console.log('QR Code updated for browser scan!');
});

// ------------------
// Client ready
// ------------------
client.on('ready', () => {
    console.log('WhatsApp bot is ready!');
    isReady = true; // bot connected
});

// ------------------
// Messages
// ------------------
client.on('message', msg => {
    console.log(`Message received: ${msg.body}`);
    if(msg.body.toLowerCase() === 'hi') {
        msg.reply('Hello! Welcome to ibetin.');
    }
});

// ------------------
// Initialize client
// ------------------
client.initialize();

// ------------------
// Browser route
// ------------------
app.get('/', (req, res) => {
    let html = `
        <meta http-equiv="refresh" content="5">
        <h1>WhatsApp Api Status</h1>
    `;

    if(latestQRCode && !isReady) {
        html += `
            <p>Status: Waiting to connect...</p>
            <img src="${latestQRCode}" alt="QR Code" />
        `;
    } else if(isReady) {
        html += `<p>Status: Connected ✅</p>`;
    } else {
        html += `<p>Status: Initializing...</p>`;
    }

    res.send(html);
});

// ------------------
// Start Express server
// ------------------
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
});

