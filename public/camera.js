const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// static ফাইল (html, js, css) লোড করার জন্য
app.use(express.static(__dirname));

// index (viewer) পেজের জন্য রুট
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// camera পেজের জন্য রুট
app.get('/camera.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'camera.html'));
});

// WebSocket Signaling Server Logic
wss.on('connection', ws => {
  ws.on('message', message => {
    // মেসেজ পাওয়ার পর অন্য সব কানেক্টেড ক্লায়েন্টকে পাঠিয়ে দেওয়া
    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message.toString());
      }
    });
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
