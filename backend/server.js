// backend/server.js
require('dotenv').config(); // Loads variables from .env into process.env
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3001; // Use port from .env, or 3001 as default

// Example test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is running!' });
});

// Add middleware later (like express.json(), cors(), authentication)

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});