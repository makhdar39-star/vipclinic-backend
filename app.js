const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000; // ← MUST have this line

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 VipClinic API is running on Render!',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ VipClinic server started on port ${PORT}`);
});