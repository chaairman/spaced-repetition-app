// backend/routes/integrationRoutes.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken'); // <-- Ensure this is required
const { protect } = require('../middleware/authMiddleware');

// --- Discord Integration Routes ---

// GET /api/integrations/discord/link (Modified)
// Initiates the Discord OAuth flow for linking.
router.get(
    '/discord/link',
    protect, // Ensures req.user is available HERE
    (req, res, next) => {
        // Generate a short-lived JWT containing the web app user ID
        const payload = { userId: req.user.id };
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error('JWT_SECRET missing for link token generation');
            return res.status(500).send('Configuration error.');
        }
        const linkToken = jwt.sign(payload, secret, { expiresIn: '5m' }); // 5 minute expiry

        // Use passport.authenticate, passing the generated token in 'state'
        const authenticator = passport.authenticate('discord', {
            state: linkToken // Pass the token as state
            // Scope ('identify') is defined in passport-setup.js
        });
        authenticator(req, res, next); // Call the authenticator middleware
    }
);

// GET /api/integrations/discord/callback (Ensure session: false)
// Handles the redirect back from Discord after user authorization.
router.get(
    '/discord/callback',
    passport.authenticate('discord', {
        failureRedirect: `${process.env.FRONTEND_URL}/settings?error=discord_link_failed`,
        session: false // <-- Ensure this is still false
    }),
    (req, res) => {
        // If successful, the verify callback in passport-setup.js ran.
        // Redirect back to the frontend settings page.
        console.log('Discord callback successful, redirecting to frontend settings.');
        res.redirect(`${process.env.FRONTEND_URL}/settings?success=discord_linked`);
    }
);

// (Other integration routes like GET /status and DELETE /link can be added later)

module.exports = router;