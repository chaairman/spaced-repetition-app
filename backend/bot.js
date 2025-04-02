// backend/bot.js

const { Client, GatewayIntentBits, ChannelType, Partials } = require('discord.js'); // <-- Add Partials
require('dotenv').config({ path: '../.env' }); // Adjust path if needed

console.log('Initializing Discord bot...');

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
    console.log(`Logged in to Discord as ${client.user.tag}!`);
    // You could add further setup here if needed once the bot is ready
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

// --- Placeholder for Message Handling (will add later) ---
client.on('messageCreate', message => {
    // Ignore messages from bots (including itself)
    if (message.author.bot) return;

    // --- Use ChannelType enum for checking DM ---
    if (message.channel.type === ChannelType.DM) { // <-- Change this line
         console.log(`Received DM from ${message.author.tag}: ${message.content}`);
         // TODO: Add logic here later (Step 9)
    }
});


// Export the client and the login function
module.exports = {
    client,
    loginBot
};

console.log('Discord bot module loaded.');