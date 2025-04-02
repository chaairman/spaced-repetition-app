// backend/server.js
require('dotenv').config();
const express = require('express');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const cors = require('cors'); // <--- Import cors
const authRoutes = require('./routes/auth'); // Import auth routes
const deckRoutes = require('./routes/deckRoutes'); // <-- Import deck routes
const cardRoutes = require('./routes/cardRoutes'); // <-- Add this line

require('./config/passport-setup'); // Run the passport setup code

const app = express();
const PORT = process.env.PORT || 3001;
// app.use((req, res, next) => {
//     console.log(`INCOMING REQUEST: ${req.method} ${req.originalUrl}`);
//     next(); // Pass control to the next middleware/router
//   });
// --- CORS Configuration ---
const corsOptions = {
    origin: process.env.FRONTEND_URL, // Allow requests only from your frontend origin
    credentials: true, // Allow cookies and authorization headers
  };
  app.use(cors(corsOptions)); // Use CORS middleware with options

// --- Middleware ---
app.use(cookieParser()); // Parse cookies attached to requests
app.use(express.json()); // Parse JSON request bodies (if needed for other routes)
app.use(passport.initialize()); // Initialize Passport

// --- Routes ---
app.use('/api/auth', authRoutes); // Mount the authentication routes
app.use('/api/decks', deckRoutes); // <-- Mount deck routes
app.use('/api/cards', cardRoutes); // <-- Add this line

app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend is running!' });
});

// Add other API routes later (e.g., for decks, cards)

app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});