require('dotenv').config();
const app = require('../src/app');

// Initialize DB connection pool
require('../src/config/db');

// Export the Express app for Vercel Serverless Functions
module.exports = app;
