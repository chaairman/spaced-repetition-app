// backend/routes/auth.js
const router = require('express').Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/authMiddleware'); // Import protect middleware

// Route to start the Google OAuth flow
// This redirects the user to Google's consent screen
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'] // Request user's profile and email
}));

// Callback route Google redirects to after user approves
router.get(
    '/google/callback',
    passport.authenticate('google', {
        failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`, // Redirect on failure
        session: false // IMPORTANT: We are using JWT, not sessions
    }),
    (req, res) => {
        try {
            // Add logs to trace execution
            if (!req.user || !req.user.id) {
                 throw new Error('User object or user ID missing after authentication.');
            }
    
            // 1. Generate JWT
            const payload = { id: req.user.id, email: req.user.email };
            const secret = process.env.JWT_SECRET;

    
            const token = jwt.sign(payload, secret, { expiresIn: '1d' });
    
            // 2. Set JWT in an HttpOnly cookie
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', // Ensure NODE_ENV is not 'production' in dev
                sameSite: 'strict',
                maxAge: 24 * 60 * 60 * 1000,
                path: '/' // Explicitly set path
            });
    
            // 3. Redirect user back to the frontend dashboard
            const redirectUrl = `${process.env.FRONTEND_URL}/dashboard`;
            res.redirect(redirectUrl);
    
        } catch (error) {
            // Log any error that occurs in the try block
            console.error('ERROR in /api/auth/google/callback handler:', error);
            // Redirect to login page with a generic error for the user
            res.redirect(`${process.env.FRONTEND_URL}/login?error=callback_processing_failed`);
        }
 
    }
);

// Route for logging out
router.post('/logout', (req, res) => {
    res.clearCookie('token'); // Remove the token cookie
    res.json({ message: 'Logged out successfully' });
});

// Route to get current logged-in user info
// This route is protected by the 'protect' middleware
router.get('/me', protect, (req, res) => {
    // If the request reaches here, 'protect' middleware was successful
    // and req.user contains the authenticated user's data
    res.json(req.user);
});

module.exports = router;