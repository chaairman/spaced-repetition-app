// backend/bot.js
const axios = require('axios');

const { Client, GatewayIntentBits, ChannelType, Partials } = require('discord.js'); // <-- Add Partials


console.log('Initializing Discord bot...');

// --- State Management Maps ---
// Map<DiscordUserID, CardID[]> - Stores queues of card IDs waiting for review per user
const userQueues = new Map();
// Map<DiscordUserID, { cardId: string, backText: string, promptMessageId: string, timestamp: Date }> - Stores the currently active prompt for a user
const activePrompts = new Map();
// --------------------------
// --- Create a new Discord client ---
// Define the intents your bot needs. For V1, we primarily need DMs.
// Guilds intent is often needed for basic operations and finding users.
// MessageContent is needed to read the user's answer in DMs.
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, // Required for some cache/user operations
        GatewayIntentBits.DirectMessages, // To receive DMs from users
        GatewayIntentBits.MessageContent, // To read the content of user replies
        // Add other intents here if needed later (e.g., GuildMessages if interacting in channels)
    ],
    partials: [Partials.Channel] 
    // If you only interact via DMs and don't need channel messages, you might remove GuildMessages later.
    // If not using channel interactions, Partials might be needed for DMs:
    // partials: [Partials.Channel] // Enable if necessary for DM Channel events
});

// --- Ready Event ---
// This event fires when the bot successfully logs in and is ready.
client.once('ready', () => {
    // --- TEMPORARY TEST CODE (REMOVE AFTER TESTING Chunk 9.4) ---
    // Replace with YOUR Discord User ID and a valid Card ID from your DB
    const TEST_DISCORD_USER_ID = "520416366705115136"; // Use your actual ID
    const TEST_CARD_ID = "2"; // Use a valid card ID from your DB

    console.log(`\n--- Running temporary test: Queuing card ${TEST_CARD_ID} for user ${TEST_DISCORD_USER_ID} ---\n`);
    // Directly call queueUserReview (NO if/else needed)
    queueUserReview(TEST_DISCORD_USER_ID, TEST_CARD_ID);
    // --- END TEMPORARY TEST CODE ---
    console.log(`Logged in to Discord as ${client.user.tag}!`);
});

// --- Login Function ---
// Function to log the bot in, using the token from .env
const loginBot = () => {
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) {
        console.error("ERROR: DISCORD_BOT_TOKEN is missing in .env file. Bot cannot start.");
        return; // Don't attempt login without a token
    }
    console.log("Attempting to log in to Discord...");
    client.login(token)
        .catch(err => {
            console.error("Error logging into Discord:", err);
            // Handle specific errors like invalid token if needed
        });
};

// --- Message Handler ---
client.on('messageCreate', async message => { // Make the handler async
    // Ignore messages from bots
    if (message.author.bot) return;

    // Only handle Direct Messages
    if (message.channel.type === ChannelType.DM) {
        // console.log(`Received DM from ${message.author.tag}: ${message.content}`); // Keep for debugging if needed

        // --- Check if this user has an active prompt ---
        const userId = message.author.id;
        const activePrompt = activePrompts.get(userId);

        if (activePrompt) {
            // --- Optional: Check if it's a reply TO the specific prompt message ---
            // This helps avoid accidental triggers if the user sends multiple messages.
            // Note: This requires the user to actually use Discord's "Reply" feature.
            // If you don't want to rely on that, you can remove this check.
            if (message.reference && message.reference.messageId !== activePrompt.promptMessageId) {
                 console.log(`User ${userId} replied, but not directly to the prompt message ${activePrompt.promptMessageId}. Ignoring.`);
                 // Maybe send a hint? "Please reply directly to the card prompt."
                 // Or just ignore it.
                 return;
            }
            // If not checking reference, remove the above if block.

            console.log(`Processing reply from ${userId} for card ${activePrompt.cardId}`);

            const userAnswer = message.content;
            const { cardId, backText, promptMessageId } = activePrompt; // Destructure for easier use

            // --- Clear the active prompt BEFORE processing ---
            // This prevents accidental double-processing if something below errors out
            // or takes time. Also handles the case where comparison/feedback fails.
            activePrompts.delete(userId);

            // --- Call functions for next steps (Chunks 9.5, 9.6, 9.7) ---
            // We will create these functions next.
            try {
                 // Compare answer (Chunk 9.5)
                 const isCorrect = compareAnswers(userAnswer, backText); // Needs compareAnswers function

                 // Send feedback and update backend (Chunk 9.6)
                 await sendFeedbackAndUpdateBackend(userId, cardId, isCorrect, backText); // Needs this function

                 // Trigger next prompt attempt (Chunk 9.7 / Reuse 9.3)
                 // Check queue again now that the user is free
                 sendNextPromptIfIdle(userId);

             } catch (processingError) {
                 console.error(`Error processing reply for card ${cardId} from user ${userId}:`, processingError);
                 // Maybe notify the user something went wrong?
                 try {
                     await message.author.send("Sorry, there was an error processing your answer. Please try reviewing again later.");
                 } catch (dmError) {
                     console.error(`Failed to send error DM to user ${userId}`);
                 }
                 // Note: The prompt was already deleted from activePrompts,
                 // and we don't automatically queue the next one on error here.
             }
             // -------------------------------------------------------

        } else {
            // Optional: Handle DMs received when the user has NO active prompt
            // console.log(`Received DM from ${userId} but no active prompt found.`);
            // Maybe send a help message or ignore.
        }
    }
});
// --- End Message Handler ---

// --- Helper function to normalize strings for comparison ---
function normalize(str) {
    if (!str) return '';
    // Lowercase, trim whitespace, replace multiple spaces with single space
    return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

// --- Function to compare user answer with correct answer using Levenshtein ---
// Make the function async to use await import()
async function compareAnswers(userAnswer, correctAnswer) {
    // --- Dynamically import the ESM 'leven' module ---
    // Note: We often need '.default' when dynamically importing an ESM default export into CJS
    const { default: leven } = await import('leven');
    // --- End dynamic import ---

    const normalizedUserAnswer = normalize(userAnswer);
    const normalizedCorrectAnswer = normalize(correctAnswer);

    // Handle empty strings edge case
    if (normalizedUserAnswer === '' && normalizedCorrectAnswer === '') return true;
    if (normalizedUserAnswer === '' || normalizedCorrectAnswer === '') return false;

    // Now we can use the imported leven function
    const distance = leven(normalizedUserAnswer, normalizedCorrectAnswer);
    const maxLength = Math.max(normalizedUserAnswer.length, normalizedCorrectAnswer.length);

    if (maxLength === 0) return distance === 0;

    const similarity = 1 - (distance / maxLength);
    const SIMILARITY_THRESHOLD = 0.8;

    console.log(`Comparing "${normalizedUserAnswer}" vs "${normalizedCorrectAnswer}" -> Distance: ${distance}, MaxLength: ${maxLength}, Similarity: ${similarity.toFixed(2)}`);


    return similarity >= SIMILARITY_THRESHOLD;
}
// --- End compareAnswers function ---

async function sendFeedbackAndUpdateBackend(discordUserId, cardId, isCorrect, correctAnswer) {
    console.log(`Placeholder: Sending feedback (Correct: ${isCorrect}) for card ${cardId} to user ${discordUserId}`);
    // TODO: Send DM feedback (Chunk 9.6)
    // TODO: Call backend API POST /api/reviews/discord (Chunk 9.6)
}
// --- End Placeholder Functions ---

// --- Function called by the (future) scheduler to queue a review ---
function queueUserReview(discordUserId, cardId) {
    if (!discordUserId || !cardId) {
        console.warn('queueUserReview called with missing userId or cardId');
        return;
    }

    // Get or create the queue for the user
    let queue = userQueues.get(discordUserId);
    if (!queue) {
        queue = [];
        userQueues.set(discordUserId, queue);
    }

    // Add cardId to the queue if not already present (optional check)
    if (!queue.includes(cardId)) {
        queue.push(cardId);
        console.log(`Queued card ${cardId} for user ${discordUserId}. Queue size: ${queue.length}`);
    }

    // Attempt to send the next prompt immediately if the user is idle
    sendNextPromptIfIdle(discordUserId);
}

// --- Function to send the next prompt if the user is not currently answering one ---
async function sendNextPromptIfIdle(discordUserId) {
    // Check if user already has an active prompt
    if (activePrompts.has(discordUserId)) {
        // console.log(`User ${discordUserId} already has an active prompt. Waiting.`);
        return;
    }

    // --- Define queue HERE ---
    const queue = userQueues.get(discordUserId);
    // --- Check queue exists and has cards ---
    if (!queue || queue.length === 0) {
        // console.log(`No cards queued for user ${discordUserId}.`);
        return;
    }

    // Get the next card ID but *don't remove it yet*
    const nextCardId = queue[0]; // Peek at the first card ID
    let cardData;

    // --- Fetch card details from backend API ---
    try {
        const backendUrl = process.env.BACKEND_URL;
        const apiKey = process.env.DISCORD_BOT_API_KEY;
        if (!backendUrl || !apiKey) throw new Error("Backend URL or Bot API Key missing in env.");

        console.log(`Workspaceing details for card ${nextCardId} from backend...`);
        const response = await axios.get(`${backendUrl}/api/internal/cards/${nextCardId}`, {
            headers: { 'X-Bot-API-Key': apiKey }
        });
        cardData = response.data;
        console.log(`Workspaceed card data for ${nextCardId}`);

    } catch (error) {
        console.error(`Error fetching card details for card ${nextCardId}:`, error.response?.data || error.message);
        // Consider removing the card ID from queue if it's invalid: queue.shift(); // Maybe add this later?
        return; // Stop processing this card attempt
    }

    // --- Send DM Prompt ---
    try {
        console.log(`Workspaceing Discord user ${discordUserId}...`);
        const user = await client.users.fetch(discordUserId);
        if (!user) throw new Error('User not found by client.');

        console.log(`Sending DM prompt for card ${nextCardId} to ${user.tag}...`);
        const promptMessage = await user.send(
            `Time to review!\n**Deck:** ${cardData.deck.name}\n\n**FRONT:**\n${cardData.frontText}`
        );
        console.log(`DM sent successfully to ${user.tag}. Message ID: ${promptMessage.id}`);

        // --- If DM sent successfully, NOW remove card from queue and set active prompt ---
        queue.shift(); // <-- Remove card from queue HERE (using the 'queue' variable defined above)
        activePrompts.set(discordUserId, {
            cardId: nextCardId,
            backText: cardData.backText,
            promptMessageId: promptMessage.id,
            timestamp: new Date()
        });
        console.log('DEBUG: Updated activePrompts:', activePrompts);

    } catch (error) {
        console.error(`Error sending DM or fetching user ${discordUserId}:`, error.code, error.message);
        // Card remains in the queue if DM sending fails
    }
}
// --- End sendNextPromptIfIdle function ---



// ... (loginBot function remains the same) ...


// Export the client, login function, AND the queueing function
module.exports = {
    client,
    loginBot,
    queueUserReview // <-- Export this
};

console.log('Discord bot module loaded.');