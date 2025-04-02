

// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const db = require('../config/db');


const protect = async (req, res, next) => {

    let token;

    // 1. Check if token exists in cookies
    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    } else {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        // 2. Verify token
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error('ERROR (protect): JWT_SECRET is not defined!');
            throw new Error('JWT Secret not configured');
        }
        const decoded = jwt.verify(token, secret);

        // 3. Get user from DB using ID from token payload
        const userQuery = await db.query(
            'SELECT id, email, display_name, created_at FROM users WHERE id = $1',
            [decoded.id]
        );

        if (userQuery.rows.length === 0) {
            // Maybe the user was deleted after the token was issued?
            return res.status(401).json({ message: 'Not authorized, user for this token not found' });
        }

        // 4. Attach user object to the request
        req.user = userQuery.rows[0];
        next(); // SUCCESS! Proceed to the actual route handler (/me)

    } catch (error) {
        // Log the actual error during verification
        console.error('ERROR (protect): Token verification or DB lookup failed:', error.name, error.message);
        // Send appropriate response based on error type
        if (error.name === 'TokenExpiredError') {
             return res.status(401).json({ message: 'Not authorized, token expired' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Not authorized, token invalid' });
        }
         // Generic failure for other errors (like DB error)
         return res.status(401).json({ message: 'Not authorized, token verification failed' });
    }
};

module.exports = { protect };