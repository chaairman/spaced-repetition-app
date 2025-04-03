// backend/routes/deckRoutes.js
const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const stream = require('stream');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // Import protect middleware
const db = require('../config/db'); // Import db connection

// Configure Multer for in-memory storage
// This is suitable for small CSV files. For very large files, disk storage might be better.
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Example: Limit file size to 5MB
    fileFilter: (req, file, cb) => {
        // Accept only CSV files
        if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only CSV files are allowed.'), false);
        }
    }
});

// GET /api/decks - Fetch all decks for the logged-in user
router.get('/', protect, async (req, res) => {
    // 'protect' middleware ensures req.user exists
    const userId = req.user.id;

    try {
        // Query to get decks and potentially related counts (simplified for now)
        // TODO: Add card counts / due counts later as per full spec if needed
        const query = `
            SELECT id, name, discord_review_enabled, created_at, updated_at
            FROM decks
            WHERE user_id = $1
            ORDER BY created_at DESC;
        `;
        const { rows } = await db.query(query, [userId]);
        res.json(rows); // Send the list of decks
    } catch (err) {
        console.error('Error fetching decks:', err);
        res.status(500).json({ message: 'Server error fetching decks' });
    }
});

// POST /api/decks - Create a new deck
router.post('/', protect, async (req, res) => {
    const userId = req.user.id;
    const { name } = req.body; // Get deck name from request body

    // Basic validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ message: 'Deck name is required and cannot be empty.' });
    }

    try {
        // Insert the new deck, returning the created row
        const query = `
            INSERT INTO decks (user_id, name)
            VALUES ($1, $2)
            RETURNING id, name, discord_review_enabled, created_at, updated_at;
        `;
        const { rows } = await db.query(query, [userId, name.trim()]);

        // Send back the newly created deck object
        res.status(201).json(rows[0]); // 201 Created status
    } catch (err) {
        console.error('Error creating deck:', err);
        // Handle potential unique constraint errors if you add them later
        res.status(500).json({ message: 'Server error creating deck' });
    }
});

// DELETE /api/decks/:deckId - Delete a specific deck
router.delete('/:deckId', protect, async (req, res) => {
    const userId = req.user.id;
    const { deckId } = req.params; // Get deckId from URL parameter

    // Validate deckId (basic check if it's a number)
    if (isNaN(parseInt(deckId, 10))) {
        return res.status(400).json({ message: 'Invalid Deck ID format.' });
    }

    try {
        // Delete the deck ONLY if it belongs to the current user
        const query = `
            DELETE FROM decks
            WHERE id = $1 AND user_id = $2
            RETURNING id; -- Return the ID if successful
        `;
        const { rowCount } = await db.query(query, [deckId, userId]);

        if (rowCount === 0) {
            // Deck not found OR user doesn't own this deck
            return res.status(404).json({ message: 'Deck not found or user not authorized to delete.' });
        }

        // If successful (rowCount === 1)
        res.status(200).json({ message: 'Deck deleted successfully' });
        // Alternatively, send 204 No Content: res.sendStatus(204);

        // Note: ON DELETE CASCADE in the 'cards' table schema
        // automatically deletes associated cards.

    } catch (err) {
        console.error('Error deleting deck:', err);
        res.status(500).json({ message: 'Server error deleting deck' });
    }
});

// PUT /api/decks/:deckId - Update a deck's name or settings
router.put('/:deckId', protect, async (req, res) => {
    const userId = req.user.id;
    const { deckId } = req.params;
    const { name, discord_review_enabled } = req.body; // Get potential updates

    // Validate deckId
    if (isNaN(parseInt(deckId, 10))) {
        return res.status(400).json({ message: 'Invalid Deck ID format.' });
    }

    // Check if at least one valid field to update was provided
    const hasName = name !== undefined && name !== null;
    const hasDiscordFlag = discord_review_enabled !== undefined && discord_review_enabled !== null;

    if (!hasName && !hasDiscordFlag) {
         return res.status(400).json({ message: 'No update fields provided (name or discord_review_enabled).' });
    }

    // Validate name if provided
    if (hasName && (typeof name !== 'string' || name.trim().length === 0)) {
         return res.status(400).json({ message: 'Deck name cannot be empty.' });
    }
     // Validate discord flag if provided
     if (hasDiscordFlag && typeof discord_review_enabled !== 'boolean') {
         return res.status(400).json({ message: 'discord_review_enabled must be true or false.' });
     }

    try {
        // Build the update query dynamically somewhat
        // We only update fields that are actually provided in the request body
        // COALESCE(new_value, old_column) keeps the old value if new_value is NULL
        // Also update the 'updated_at' timestamp
        const query = `
            UPDATE decks
            SET
                name = COALESCE($1, name),
                discord_review_enabled = COALESCE($2, discord_review_enabled),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3 AND user_id = $4
            RETURNING id, name, discord_review_enabled, created_at, updated_at;
        `;

        // Pass values or null to the query based on what was provided
        const values = [
            hasName ? name.trim() : null,
            hasDiscordFlag ? discord_review_enabled : null,
            deckId,
            userId
        ];

        const { rows, rowCount } = await db.query(query, values);

        if (rowCount === 0) {
            // Deck not found OR user doesn't own this deck
             return res.status(404).json({ message: 'Deck not found or user not authorized to update.' });
        }

        // Send back the updated deck object
        res.status(200).json(rows[0]);

    } catch (err) {
        console.error('Error updating deck:', err);
        res.status(500).json({ message: 'Server error updating deck' });
    }
});

// ****** INSERT NEW ROUTE HANDLER HERE ******
// GET /api/decks/:deckId - Fetch details for a SINGLE deck
router.get('/:deckId', protect, async (req, res) => {
    const userId = req.user.id;
    const { deckId } = req.params;

    if (isNaN(parseInt(deckId, 10))) {
        return res.status(400).json({ message: 'Invalid Deck ID format.' });
    }

    try {
        const query = `
            SELECT id, name, discord_review_enabled, created_at, updated_at
            FROM decks
            WHERE id = $1 AND user_id = $2;
        `;
        const { rows } = await db.query(query, [deckId, userId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Deck not found or user not authorized.' });
        }

        res.status(200).json(rows[0]); // Send the single deck object

    } catch (err) {
        console.error(`Error fetching deck details for deck ${deckId}:`, err);
        res.status(500).json({ message: 'Server error fetching deck details' });
    }
});
// ****** END OF NEW ROUTE HANDLER ******

// POST /api/decks/:deckId/cards - Create a new card in a specific deck
router.post('/:deckId/cards', protect, async (req, res) => {
    const userId = req.user.id;
    const { deckId } = req.params;
    const { frontText, backText } = req.body;

    // --- Basic Validation ---
    if (isNaN(parseInt(deckId, 10))) {
        return res.status(400).json({ message: 'Invalid Deck ID format.' });
    }
    if (!frontText || typeof frontText !== 'string' || frontText.trim().length === 0) {
        return res.status(400).json({ message: 'Card front text is required.' });
    }
    if (!backText || typeof backText !== 'string' || backText.trim().length === 0) {
        return res.status(400).json({ message: 'Card back text is required.' });
    }
    // Optional: Add length limits if desired

    try {
        // --- Authorization Check: Ensure the user owns the deck ---
        const deckCheckQuery = 'SELECT id FROM decks WHERE id = $1 AND user_id = $2';
        const deckCheckResult = await db.query(deckCheckQuery, [deckId, userId]);

        if (deckCheckResult.rows.length === 0) {
            // Deck not found OR user doesn't own this deck
            return res.status(404).json({ message: 'Deck not found or user not authorized to add cards to this deck.' });
        }

        // --- Database Insert ---
        // Note: SRS fields (interval, ease_factor, next_review_at) use DB defaults
        const insertQuery = `
            INSERT INTO cards (deck_id, front_text, back_text)
            VALUES ($1, $2, $3)
            RETURNING id, deck_id, front_text, back_text, created_at, updated_at, interval, ease_factor, next_review_at;
            -- Return the full new card object including default SRS values
        `;
        const values = [deckId, frontText.trim(), backText.trim()];
        const { rows } = await db.query(insertQuery, values);

        // --- Send Response ---
        res.status(201).json(rows[0]); // 201 Created with the new card data

    } catch (err) {
        console.error(`Error creating card in deck ${deckId}:`, err);
        res.status(500).json({ message: 'Server error creating card' });
    }
});

// GET /api/decks/:deckId/cards - Fetch all cards for a specific deck
router.get('/:deckId/cards', protect, async (req, res) => {
    const userId = req.user.id;
    const { deckId } = req.params;

    // --- Basic Validation ---
    if (isNaN(parseInt(deckId, 10))) {
        return res.status(400).json({ message: 'Invalid Deck ID format.' });
    }

    try {
        // --- Authorization Check: Ensure the user owns the deck ---
        // (Same check as in POST /cards, could be refactored later)
        const deckCheckQuery = 'SELECT id FROM decks WHERE id = $1 AND user_id = $2';
        const deckCheckResult = await db.query(deckCheckQuery, [deckId, userId]);

        if (deckCheckResult.rows.length === 0) {
            return res.status(404).json({ message: 'Deck not found or user not authorized to view these cards.' });
        }

        // --- Database Select ---
        const selectQuery = `
            SELECT id, deck_id, front_text, back_text, created_at, updated_at, interval, ease_factor, next_review_at
            FROM cards
            WHERE deck_id = $1
            ORDER BY created_at ASC; -- Or however you want to order them
        `;
        const { rows } = await db.query(selectQuery, [deckId]);

        // --- Send Response ---
        res.status(200).json(rows); // Send the array of card objects

    } catch (err) {
        console.error(`Error fetching cards for deck ${deckId}:`, err);
        res.status(500).json({ message: 'Server error fetching cards' });
    }
});

// POST /api/decks/:deckId/cards/import - Import cards from CSV
router.post('/:deckId/cards/import', protect, upload.single('csvFile'), async (req, res) => {
    // 'protect' ensures req.user exists
    // 'upload.single('csvFile')' processes the uploaded file named 'csvFile'
    // The file buffer will be available in req.file.buffer

    const userId = req.user.id;
    const { deckId } = req.params;

    // --- Validation ---
    if (isNaN(parseInt(deckId, 10))) {
        return res.status(400).json({ message: 'Invalid Deck ID format.' });
    }
    if (!req.file) {
        return res.status(400).json({ message: 'No CSV file uploaded.' });
    }

    // --- Check Deck Ownership ---
    try {
        const deckCheckQuery = 'SELECT id FROM decks WHERE id = $1 AND user_id = $2';
        const deckCheckResult = await db.query(deckCheckQuery, [deckId, userId]);
        if (deckCheckResult.rows.length === 0) {
            return res.status(404).json({ message: 'Deck not found or user not authorized.' });
        }
    } catch (authError) {
        console.error('Error checking deck ownership during import:', authError);
        return res.status(500).json({ message: 'Server error checking deck ownership.' });
    }

    // --- Process CSV ---
    const cardsToInsert = [];
    const errors = [];
    let rowCount = 0;
    let successCount = 0;

    // Create a readable stream from the buffer
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    bufferStream
        .pipe(csv({
            mapHeaders: ({ header }) => header.trim().toLowerCase(), // Normalize headers
            // Assuming CSV format: Column 1: front, Column 2: back
            // If headers are present, it tries to match; otherwise uses index.
            // Adjust headers array if your expected CSV header names are different.
            headers: ['front_text', 'back_text'] // Expected headers (lowercase)
        }))
        .on('data', (row) => {
            rowCount++;
            const front = row.front_text ? row.front_text.trim() : '';
            const back = row.back_text ? row.back_text.trim() : '';

            // Basic validation for each row
            if (front && back) {
                cardsToInsert.push({ front, back });
                successCount++;
            } else {
                errors.push(`Row ${rowCount}: Missing front or back text.`);
            }
        })
        .on('end', async () => {
            // --- Database Bulk Insert ---
            if (cardsToInsert.length > 0) {
                try {
                    // Constructing a bulk insert query
                    // IMPORTANT: For many rows, consider batching inserts or using COPY FROM STDIN if feasible.
                    // This simple VALUES approach can be slow for very large files.
                    const valuesPlaceholders = [];
                    const valuesData = [];
                    let paramIndex = 1; // Start parameter index from 1 for deckId

                    cardsToInsert.forEach(card => {
                        valuesPlaceholders.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
                        valuesData.push(deckId, card.front, card.back);
                    });

                    const insertQuery = `
                        INSERT INTO cards (deck_id, front_text, back_text)
                        VALUES ${valuesPlaceholders.join(', ')}
                    `;
                    // console.log("Executing Bulk Insert Query:", insertQuery); // Debug log
                    // console.log("With Values:", valuesData); // Debug log

                    await db.query(insertQuery, valuesData);
                    console.log(`Successfully inserted ${cardsToInsert.length} cards for deck ${deckId}.`);

                } catch (dbError) {
                    console.error('Error during bulk card insert:', dbError);
                    // Override previous success/error counts as the whole batch failed
                    return res.status(500).json({
                        message: 'Database error during card import.',
                        successCount: 0,
                        errorCount: rowCount, // All rows failed due to DB error
                        errors: [`Database error: ${dbError.message || 'Unknown DB error'}`]
                    });
                }
            }

            // --- Send Final Response ---
            console.log(`CSV processing finished for deck ${deckId}. Rows: ${rowCount}, Success: ${successCount}, Errors: ${errors.length}`);
            res.status(200).json({
                message: `Import finished. Processed ${rowCount} rows.`,
                successCount: successCount,
                errorCount: errors.length,
                errors: errors // Send back specific row errors
            });
        })
        .on('error', (parseError) => {
            console.error('Error parsing CSV stream:', parseError);
            res.status(400).json({ message: `CSV parsing error: ${parseError.message}` });
        });
});


// Add multer error handling middleware (optional, but recommended)
// Place this *after* all routes using 'upload' in this router file
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading.
        console.error('Multer error:', err);
        return res.status(400).json({ message: `File upload error: ${err.message}` });
    } else if (err) {
        // An unknown error occurred when uploading (e.g., fileFilter rejection).
        console.error('Non-Multer upload error:', err);
        return res.status(400).json({ message: err.message || 'File upload failed.' });
    }
    // If no error or not an upload error, pass to next middleware
    next(err); // Pass other errors down the chain
});

module.exports = router;