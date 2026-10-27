
const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/api', require('./routes'));

// Export app
module.exports = app;