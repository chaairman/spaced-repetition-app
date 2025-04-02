// backend/config/passport-setup.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./db'); // Import your db config
require('dotenv').config({ path: '../.env' });

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

// Note: We are NOT using serializeUser/deserializeUser because we're using
// JWT for session management (session: false in passport.authenticate)