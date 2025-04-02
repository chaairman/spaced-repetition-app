// backend/config/db.js
const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' }); // Adjust path if needed

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Optional: Add SSL config for production environments
    // ssl: {
    //   rejectUnauthorized: false // Adjust based on your hosting provider's requirements
    // }
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool // Export pool if needed elsewhere directly
};