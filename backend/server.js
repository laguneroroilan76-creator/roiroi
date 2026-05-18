require('dotenv').config({ quiet: true });
const app = require('./src/app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Scalable Backend Server running on http://localhost:${PORT}`);
});

// Diagnostic: Keep process alive
setInterval(() => {}, 1000);
