// backend/routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const { protectBot } = require('../middleware/botAuthMiddleware');
const db = require('../config/db');

// --- Reusable SRS Logic (Consider moving to a shared utils file later) ---
// This is the same simplified logic from studyRoutes.js
const calculateSrs = (currentInterval, currentEaseFactor, rating) => {
    // ... (Paste the exact same calculateSrs function here from studyRoutes.js) ...
    // ... including the switch statement and date calculation ...
     let newInterval;
     let newEaseFactor = currentEaseFactor;
     switch (rating) {
        case 'Again':
            newInterval = 0;
            newEaseFactor = Math.max(1.3, currentEaseFactor - 0.2);
            break;
        case 'Hard': // Not used by Discord bot V1, but keep for consistency
            newInterval = Math.max(1, Math.round(currentInterval * 1.0));
            newEaseFactor = Math.max(1.3, currentEaseFactor - 0.15);
            break;
        case 'Good':
            newInterval = Math.max(1, Math.round(currentInterval * currentEaseFactor));
            break;
        case 'Easy': // Not used by Discord bot V1, but keep for consistency
            newInterval = Math.max(1, Math.round(currentInterval * currentEaseFactor * 1.3));
            newEaseFactor = currentEaseFactor + 0.15;
            break;
        default: // Should map 'correct'/'incorrect' before calling this
            console.warn(`Unknown rating in calculateSrs: ${rating}. Defaulting to 'Good'.`);
            newInterval = Math.max(1, Math.round(currentInterval * currentEaseFactor));
            break;
    }
    const now = new Date();
    const nextReviewDate = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);
    return {
        interval: newInterval,
        ease_factor: newEaseFactor,
        next_review_at: nextReviewDate.toISOString(),
    };
};


// POST /api/reviews/discord - Receives review outcome from Discord bot
// Protected by API Key
router.post('/discord', protectBot, async (req, res) => {
    const { cardId, outcome } = req.body; // Expect cardId, outcome ('correct' | 'incorrect') [cite: 203]

    // --- Basic Validation ---
    if (isNaN(parseInt(cardId, 10))) {
        return res.status(400).json({ message: 'Invalid Card ID format.' });
    }
    if (outcome !== 'correct' && outcome !== 'incorrect') {
        return res.status(400).json({ message: 'Invalid outcome. Must be "correct" or "incorrect".' });
    }

    try {
        // --- Map outcome to rating ---
        // V1: correct -> 'Good', incorrect -> 'Again' [cite: 41, 115, 221-222]
        const rating = (outcome === 'correct') ? 'Good' : 'Again';

        // --- Get Current SRS State ---
        // Note: No ownership check here, assumes bot only gets valid cardIds
        // from the scheduler which *should* have checked ownership.
        // Could add an ownership check here for extra safety if desired.
        const currentStateQuery = 'SELECT interval, ease_factor FROM cards WHERE id = $1';
        const currentStateResult = await db.query(currentStateQuery, [cardId]);

        if (currentStateResult.rows.length === 0) {
             // Card might have been deleted between scheduling and review
             console.warn(`Discord review submitted for non-existent card ${cardId}`);
             return res.status(404).json({ message: 'Card not found (may have been deleted).' });
        }
        const { interval: currentInterval, ease_factor: currentEaseFactor } = currentStateResult.rows[0];

        // --- Calculate New SRS State ---
        const { interval: newInterval, ease_factor: newEaseFactor, next_review_at: newNextReviewAt } = calculateSrs(
            currentInterval,
            currentEaseFactor,
            rating // Use the mapped rating
        );

        // --- Update Database ---
        const updateQuery = `
            UPDATE cards
            SET interval = $1, ease_factor = $2, next_review_at = $3, updated_at = NOW()
            WHERE id = $4
            RETURNING id;
        `;
        const updateValues = [newInterval, newEaseFactor, newNextReviewAt, cardId];
        const updateResult = await db.query(updateQuery, updateValues);

        if (updateResult.rowCount === 0) {
             throw new Error(`Failed to update SRS state for card ${cardId} after Discord review.`);
        }

        // --- Send Success Response ---
        res.status(200).json({ message: 'Discord review recorded' }); // [cite: 204]

    } catch (err) {
        console.error(`Error processing discord review for card ${cardId}:`, err);
        res.status(500).json({ message: 'Server error processing discord review' });
    }
});

module.exports = router;