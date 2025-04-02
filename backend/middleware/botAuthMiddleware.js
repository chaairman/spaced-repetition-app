// backend/middleware/botAuthMiddleware.js


const protectBot = (req, res, next) => {
    const providedKey = req.header('X-Bot-API-Key') || req.body.botApiKey || req.query.botApiKey;
    const expectedKey = process.env.DISCORD_BOT_API_KEY;

    if (!expectedKey) {
        console.error('ERROR: DISCORD_BOT_API_KEY is not defined in .env for bot authentication!');
        return res.status(500).json({ message: 'Internal server configuration error.' });
    }

    if (!providedKey || providedKey !== expectedKey) {
        console.warn('Failed bot API authentication attempt.');
        return res.status(401).json({ message: 'Unauthorized: Invalid or missing API key for bot.' });
    }

    // Key is valid, proceed
    next();
};

module.exports = { protectBot };