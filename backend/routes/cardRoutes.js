// backend/routes/cardRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // Import protect middleware
const db = require('../config/db'); // Import db connection

// --- Authorization Helper Function ---
// Checks if the logged-in user owns the deck associated with a given card ID.
const checkCardOwnership = async (cardId, userId) => {
    const query = `
        SELECT c.id
        FROM cards c
        JOIN decks d ON c.deck_id = d.id
        WHERE c.id = $1 AND d.user_id = $2;
    `;
    const { rowCount } = await db.query(query, [cardId, userId]);
    return rowCount > 0;
};

// --- Card Routes ---

// PUT /api/cards/:cardId - Update a specific card's text
router.put('/:cardId', protect, async (req, res) => {
    const userId = req.user.id;
    const { cardId } = req.params;
    const { frontText, backText } = req.body; // Get updated text

    // Basic Validation
    if (isNaN(parseInt(cardId, 10))) {
        return res.status(400).json({ message: 'Invalid Card ID format.' });
    }
    const hasFront = frontText !== undefined && frontText !== null;
    const hasBack = backText !== undefined && backText !== null;
    if (!hasFront && !hasBack) {
        return res.status(400).json({ message: 'No update fields provided (frontText or backText).' });
    }
    if (hasFront && (typeof frontText !== 'string' || frontText.trim().length === 0)) {
        return res.status(400).json({ message: 'Card front text cannot be empty.' });
    }
    if (hasBack && (typeof backText !== 'string' || backText.trim().length === 0)) {
        return res.status(400).json({ message: 'Card back text cannot be empty.' });
    }

    try {
        // Authorization Check
        const ownsCard = await checkCardOwnership(cardId, userId);
        if (!ownsCard) {
            return res.status(404).json({ message: 'Card not found or user not authorized.' });
        }

        // Database Update
        const updateQuery = `
            UPDATE cards
            SET
                front_text = COALESCE($1, front_text),
                back_text = COALESCE($2, back_text),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING id, deck_id, front_text, back_text, created_at, updated_at, interval, ease_factor, next_review_at;
        `;
        const values = [
            hasFront ? frontText.trim() : null,
            hasBack ? backText.trim() : null,
            cardId
        ];
        const { rows } = await db.query(updateQuery, values);

        // Send Response (should always have 1 row due to prior check)
        res.status(200).json(rows[0]);

    } catch (err) {
        console.error(`Error updating card ${cardId}:`, err);
        res.status(500).json({ message: 'Server error updating card' });
    }
});

// DELETE /api/cards/:cardId - Delete a specific card
router.delete('/:cardId', protect, async (req, res) => {
    const userId = req.user.id;
    const { cardId } = req.params;

    // Basic Validation
    if (isNaN(parseInt(cardId, 10))) {
        return res.status(400).json({ message: 'Invalid Card ID format.' });
    }

    try {
        // Authorization Check
        const ownsCard = await checkCardOwnership(cardId, userId);
        if (!ownsCard) {
            return res.status(404).json({ message: 'Card not found or user not authorized.' });
        }

        // Database Delete
        const deleteQuery = 'DELETE FROM cards WHERE id = $1 RETURNING id;';
        const { rowCount } = await db.query(deleteQuery, [cardId]);

        // rowCount should be 1 because of the ownership check, but we double-check
        if (rowCount === 0) {
             // This case should ideally not be reached if checkCardOwnership works
             return res.status(404).json({ message: 'Card not found.' });
        }

        // Send Success Response
        res.status(200).json({ message: 'Card deleted successfully' }); // Or res.sendStatus(204)

    } catch (err) {
        console.error(`Error deleting card ${cardId}:`, err);
        res.status(500).json({ message: 'Server error deleting card' });
    }
});


module.exports = router;