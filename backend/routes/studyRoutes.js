// backend/routes/studyRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const db = require('../config/db');

// --- Study Routes ---

// GET /api/study/:deckId/next - Fetch the next due card for a study session
router.get('/:deckId/next', protect, async (req, res) => {
    const userId = req.user.id;
    const { deckId } = req.params;

    if (isNaN(parseInt(deckId, 10))) {
        return res.status(400).json({ message: 'Invalid Deck ID format.' });
    }

    try {
        // Verify user owns the deck
        const deckCheckQuery = 'SELECT id FROM decks WHERE id = $1 AND user_id = $2';
        const deckCheckResult = await db.query(deckCheckQuery, [deckId, userId]);

        if (deckCheckResult.rows.length === 0) {
            return res.status(404).json({ message: 'Deck not found or user not authorized.' });
        }

        // Find the next due card
        const nextCardQuery = `
            SELECT id, front_text, back_text -- Only fetch needed fields
            FROM cards
            WHERE deck_id = $1
              AND next_review_at <= NOW() -- Card is due
            ORDER BY next_review_at ASC    -- Get the one due earliest
            LIMIT 1;                       -- Only need one
        `;
        const { rows } = await db.query(nextCardQuery, [deckId]);

        if (rows.length === 0) {
            res.status(200).json(null); // No cards due
        } else {
            res.status(200).json(rows[0]); // Send the next card
        }

    } catch (err) {
        console.error(`Error fetching next card for deck ${deckId}:`, err);
        res.status(500).json({ message: 'Server error fetching next card' });
    }
});


// --- Helper for Card Ownership Check (similar to cardRoutes.js) ---
// You could move this to a shared helper file later if desired
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

// --- Simplified SRS Logic Function ---
// Based on V1 requirements (fixed parameters, Good/Again for Discord)
// This is a placeholder/simplified version. Full SM-2 is more complex.
const calculateSrs = (currentInterval, currentEaseFactor, rating) => {
    let newInterval;
    let newEaseFactor = currentEaseFactor; // Start with current ease

    // Apply rating adjustments (Example logic, customize as needed)
    switch (rating) {
        case 'Again':
            newInterval = 0; // Reset interval (or set to 1 day, e.g., 1 * 24 * 60 * 60 * 1000 for ms)
            newEaseFactor = Math.max(1.3, currentEaseFactor - 0.2); // Decrease ease, minimum 1.3
            break;
        case 'Hard':
            newInterval = Math.max(1, Math.round(currentInterval * 1.0)); // Slightly increase, ensure at least 1 day
            newEaseFactor = Math.max(1.3, currentEaseFactor - 0.15); // Small decrease
            break;
        case 'Good':
            // Increase interval based on current interval and ease factor
            newInterval = Math.max(1, Math.round(currentInterval * currentEaseFactor));
            // Ease factor remains unchanged for 'Good' in simple models
            break;
        case 'Easy':
            // Significantly increase interval, also increase ease factor
            newInterval = Math.max(1, Math.round(currentInterval * currentEaseFactor * 1.3)); // Example boost
            newEaseFactor = currentEaseFactor + 0.15;
            break;
        default:
            console.warn(`Unknown rating: ${rating}. Defaulting to 'Good'.`);
            newInterval = Math.max(1, Math.round(currentInterval * currentEaseFactor));
            break;
    }

    // Calculate next review date (add interval days to NOW)
    // Interval is in days for this example logic
    const now = new Date();
    const nextReviewDate = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);

    return {
        interval: newInterval,
        ease_factor: newEaseFactor,
        next_review_at: nextReviewDate.toISOString(), // Store as ISO string (TIMESTAMPTZ compatible)
    };
};


// POST /api/study/review - Submit a review result from the web app
router.post('/review', protect, async (req, res) => {
    const userId = req.user.id;
    const { cardId, rating } = req.body; // cardId and "Again", "Hard", "Good", "Easy"

    // --- Basic Validation ---
    if (isNaN(parseInt(cardId, 10))) {
        return res.status(400).json({ message: 'Invalid Card ID format.' });
    }
    const validRatings = ['Again', 'Hard', 'Good', 'Easy'];
    if (!rating || !validRatings.includes(rating)) {
        return res.status(400).json({ message: `Invalid rating. Must be one of: ${validRatings.join(', ')}` });
    }

    try {
        // --- Authorization Check ---
        const ownsCard = await checkCardOwnership(cardId, userId);
        if (!ownsCard) {
            return res.status(404).json({ message: 'Card not found or user not authorized.' });
        }

        // --- Get Current SRS State ---
        const currentStateQuery = 'SELECT interval, ease_factor FROM cards WHERE id = $1';
        const currentStateResult = await db.query(currentStateQuery, [cardId]);
        if (currentStateResult.rows.length === 0) {
             // Should not happen if checkCardOwnership passed, but good sanity check
             return res.status(404).json({ message: 'Card data not found after authorization.' });
        }
        const { interval: currentInterval, ease_factor: currentEaseFactor } = currentStateResult.rows[0];


        // --- Calculate New SRS State ---
        const { interval: newInterval, ease_factor: newEaseFactor, next_review_at: newNextReviewAt } = calculateSrs(
            currentInterval,
            currentEaseFactor,
            rating
        );


        // --- Update Database ---
        const updateQuery = `
            UPDATE cards
            SET interval = $1, ease_factor = $2, next_review_at = $3, updated_at = NOW()
            WHERE id = $4
            RETURNING id; -- Return ID to confirm update
        `;
        const updateValues = [newInterval, newEaseFactor, newNextReviewAt, cardId];
        const updateResult = await db.query(updateQuery, updateValues);

        if (updateResult.rowCount === 0) {
             // Should not happen if previous checks passed
             throw new Error('Failed to update card SRS state after calculation.');
        }

        // --- Send Success Response ---
        res.status(200).json({ message: 'Review recorded' });

    } catch (err) {
        console.error(`Error submitting review for card ${cardId}:`, err);
        res.status(500).json({ message: 'Server error submitting review' });
    }
});

module.exports = router; // Ensure this is at the very end