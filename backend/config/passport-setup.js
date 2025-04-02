// backend/config/passport-setup.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const DiscordStrategy = require('passport-discord').Strategy;
const jwt = require('jsonwebtoken'); 

const db = require('./db'); // Import your db config


// --- Google Strategy Configuration ---
passport.use(
    new GoogleStrategy(
        {
            // Options for Google strategy
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
        },
        async (accessToken, refreshToken, profile, done) => {
            // This verify callback runs after Google authenticates
            // profile contains the user info from Google
            const googleId = profile.id;
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
            const displayName = profile.displayName;

            if (!email) {
                return done(new Error("Email not provided by Google profile."), null);
            }

            try {
                // 1. Check if user already exists in your DB
                const currentUserQuery = await db.query('SELECT * FROM users WHERE google_id = $1', [googleId]);

                if (currentUserQuery.rows.length > 0) {
                    // User exists
                    console.log('User is:', currentUserQuery.rows[0]);
                    done(null, currentUserQuery.rows[0]); // Pass existing user to Passport
                } else {
                    // 2. If not, create a new user in your DB
                    const newUserQuery = await db.query(
                        'INSERT INTO users (google_id, email, display_name) VALUES ($1, $2, $3) RETURNING *',
                        [googleId, email, displayName]
                    );
                    console.log('Created new user:', newUserQuery.rows[0]);
                    done(null, newUserQuery.rows[0]); // Pass newly created user to Passport
                }
            } catch (err) {
                console.error("Error in Google Strategy verify callback:", err);
                done(err, null); // Pass error to Passport
            }
        }
    )
);

// --- Discord Strategy Configuration (Updated Verify Callback) ---
passport.use(
    new DiscordStrategy(
        {
            clientID: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET,
            callbackURL: process.env.DISCORD_CALLBACK_URL,
            scope: ['identify'],
            passReqToCallback: true // Needed to access req.query.state
        },
        // Updated Verify Callback
        async (req, accessToken, refreshToken, profile, done) => {
            const linkToken = req.query.state; // Get state token from query params
            let webAppUserId;

            if (!linkToken) {
                console.error('Discord Strategy Error: No state token found in callback request.');
                return done(new Error('Link request is missing state. Please try again.'), null);
            }

            // Verify the state token
            try {
                const secret = process.env.JWT_SECRET;
                if (!secret) throw new Error('JWT_SECRET missing for state verification');
                const decodedState = jwt.verify(linkToken, secret);
                webAppUserId = decodedState.userId; // Extract user ID from state token
                if (!webAppUserId) throw new Error('User ID not found in state token.');
            } catch (stateError) {
                console.error('Discord Strategy Error: Invalid or expired state token.', stateError.message);
                return done(new Error('Link request timed out or was invalid. Please try again.'), null);
            }

            // Proceed using webAppUserId extracted from the verified state token
            const discordUserId = profile.id;
            const discordUsername = profile.username;

            try {
                // Check if Discord ID already linked to another user
                const existingLinkQuery = 'SELECT user_id FROM discord_links WHERE discord_user_id = $1 AND user_id != $2';
                const existingLinkResult = await db.query(existingLinkQuery, [discordUserId, webAppUserId]);
                if (existingLinkResult.rows.length > 0) {
                    return done(new Error('This Discord account is already linked to another user.'), null);
                }

                // Upsert the link in the database
                const upsertQuery = `
                    INSERT INTO discord_links (user_id, discord_user_id, discord_username)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (user_id)
                    DO UPDATE SET discord_user_id = EXCLUDED.discord_user_id, discord_username = EXCLUDED.discord_username, linked_at = CURRENT_TIMESTAMP
                    RETURNING *;
                `;
                const values = [webAppUserId, discordUserId, discordUsername];
                await db.query(upsertQuery, values); // We don't necessarily need the result row here

                console.log(`Discord link successful for web app user ${webAppUserId}`);
                // Pass back a minimal object representing the web app user
                return done(null, { id: webAppUserId });

            } catch (err) {
                console.error('Error saving Discord link to DB:', err);
                return done(err, null);
            }
        }
    )
);
// Note: We are NOT using serializeUser/deserializeUser because we're using
// JWT for session management (session: false in passport.authenticate)