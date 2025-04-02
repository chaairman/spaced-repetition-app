// backend/routes/internalRoutes.js
const express = require('express');
const router = express.Router();
const { protectBot } = require('../middleware/botAuthMiddleware');
const db = require('../config/db');

// GET /api/internal/cards/:cardId - Fetch card details needed for bot DM
// Protected by API Key
router.get('/cards/:cardId', protectBot, async (req, res) => {
    const { cardId } = req.params;

    if (isNaN(parseInt(cardId, 10))) {
        return res.status(400).json({ message: 'Invalid Card ID format.' });
    }

    try {
        // Fetch card details and include the deck name
        const query = `
            SELECT c.front_text, c.back_text, d.name AS deck_name
            FROM cards c
            JOIN decks d ON c.deck_id = d.id
            WHERE c.id = $1;
        `;
        const { rows } = await db.query(query, [cardId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Card not found.' });
        }

        // Send the required details
        res.status(200).json({
            frontText: rows[0].front_text,
            backText: rows[0].back_text,
            deck: { name: rows[0].deck_name }
        }); // Match expected format [cite: 206]

    } catch (err) {
        console.error(`Error fetching internal card details for card ${cardId}:`, err);
        res.status(500).json({ message: 'Server error fetching internal card details' });
    }
});

module.exports = router;