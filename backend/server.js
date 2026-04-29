require('dotenv').config({ quiet: true });
const app = require('./src/app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Scalable Backend Server running on http://172.16.28.96:${PORT}`);
});
