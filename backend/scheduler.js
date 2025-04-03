// // backend/scheduler.js
// const cron = require('node-cron');
// const db = require('./config/db');
// const { queueUserReview } = require('./bot'); // Import the function to queue reviews

// console.log('Scheduler module loaded.');

// // --- Function to find and queue due Discord reviews ---
// const checkAndQueueDueCards = async () => {
//     console.log(`[${new Date().toISOString()}] Running scheduled job: Checking for due Discord reviews...`);

//     // --- Function to find and queue due Discord reviews ---
// const checkAndQueueDueCards = async () => {
//     console.log(`[${new Date().toISOString()}] Running scheduled job: Checking for due Discord reviews...`);
//     let dueReviews = []; // Initialize empty array

//     try {
//         // --- Database Query ---
//         const query = `
//             SELECT dl.discord_user_id, c.id AS card_id
//             FROM cards c
//             JOIN decks d ON c.deck_id = d.id
//             JOIN discord_links dl ON d.user_id = dl.user_id
//             WHERE c.next_review_at <= NOW()
//               AND d.discord_review_enabled = true;
//         `;
//         // This query finds all card IDs that are due,
//         // belong to decks enabled for Discord review,
//         // and retrieves the linked Discord User ID for the deck's owner.

//         const { rows } = await db.query(query);
//         dueReviews = rows; // Assign query results to dueReviews
//         // Example rows: [{ discord_user_id: '123...', card_id: '5' }, { discord_user_id: '456...', card_id: '12' }]
//         // --- End Query ---


//         if (dueReviews.length === 0) {
//             console.log(`[Scheduler] No due Discord reviews found.`);
//             // No 'return;' needed here if we want the 'Finished checking' log below to run
//         } else {
//             console.log(`[Scheduler] Found ${dueReviews.length} due reviews to queue.`);

//             // TODO: Trigger the bot for each due review (Chunk 4)
//             dueReviews.forEach(review => {
//                 queueUserReview(review.discord_user_id, review.card_id); 
//             });
//         }

//     } catch (error) {
//         console.error('[Scheduler] Error checking for due cards:', error);
//     } finally {
//         // This log helps confirm the job ran, even if no cards were found
//         console.log(`[Scheduler] Finished checking for due Discord reviews.`);
//     }
// };

// // --- Function to initialize the scheduler ---
// const initializeScheduler = () => {
//     console.log('Initializing scheduler...');

//     // --- Schedule the job ---
//     // Cron pattern: (Minute Hour DayOfMonth Month DayOfWeek)
//     // '*/5 * * * *' = Run every 5 minutes
//     // '* * * * *'  = Run every 1 minute (FOR TESTING)
//     cron.schedule('* * * * *', checkAndQueueDueCards, {
//         scheduled: true,
//         timezone: "Africa/Lagos" // Or your preferred timezone, e.g., "Africa/Lagos" for WAT
//    });
//    // --- End scheduling ---

//     console.log("Scheduler initialized (Job not scheduled yet).");

//     // Optional: Run once immediately on startup for testing?
//     // checkAndQueueDueCards();
// };

// exports = { initializeScheduler };

// backend/scheduler.js
// console.log('DEBUG: reviewRoutes.js is being loaded. (Line 1)'); // Can remove this debug log now
const cron = require('node-cron');
const db = require('./config/db');
const { queueUserReview } = require('./bot'); // Ensure this require path is correct

console.log('Scheduler module loaded.');

// --- Function to find and queue due Discord reviews ---
const checkAndQueueDueCards = async () => {
    console.log(`[${new Date().toISOString()}] Running scheduled job: Checking for due Discord reviews...`);
    let dueReviews = [];

    try {
        // --- Database Query ---
        const query = `
            SELECT dl.discord_user_id, c.id AS card_id
            FROM cards c
            JOIN decks d ON c.deck_id = d.id
            JOIN discord_links dl ON d.user_id = dl.user_id
            WHERE c.next_review_at <= NOW()
              AND d.discord_review_enabled = true;
        `;
        const { rows } = await db.query(query);
        dueReviews = rows;
        // --- End Query ---

        if (dueReviews.length === 0) {
            console.log(`[Scheduler] No due Discord reviews found.`);
        } else {
            console.log(`[Scheduler] Found ${dueReviews.length} due reviews to queue.`);
            // --- Trigger the bot ---
            dueReviews.forEach(review => {
                queueUserReview(review.discord_user_id, review.card_id); // Call the bot function
            });
            // --- End triggering ---
        }

    } catch (error) {
        console.error('[Scheduler] Error checking for due cards:', error);
    } finally {
        console.log(`[Scheduler] Finished checking for due Discord reviews.`);
    }
};

// --- Function to initialize the scheduler ---
const initializeScheduler = () => {
    console.log('Initializing scheduler...');

    // --- Schedule the job (Every minute for testing) ---
    cron.schedule('* * * * *', checkAndQueueDueCards, {
         scheduled: true,
         timezone: "UTC" // Or your preferred timezone
    });
    // --- End scheduling ---

    console.log("Scheduler initialized and job scheduled to run every minute (for testing).");
};

module.exports = { initializeScheduler }; // Keep the export