require('dotenv').config({ quiet: true });
const app = require('./src/app');
const http = require('http');
const socket = require('./src/utils/socket');
const { initConsistencyJob } = require('./src/jobs/consistency.job');
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.io
const io = socket.init(server);
io.on('connection', (client) => {
  client.on('join_ticket', (ticketId) => {
    client.join(`ticket_${ticketId}`);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Scalable Backend Server running on http://localhost:${PORT}`);
  initConsistencyJob();
});

// Diagnostic: Keep process alive
setInterval(() => {}, 1000);
