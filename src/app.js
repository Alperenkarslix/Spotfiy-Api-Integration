const express = require('express');
const path = require('path');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');
const spotifyRoutes = require('./routes/spotify.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Static files middleware
app.use(express.static(path.join(__dirname, '../public')));

// Add middleware to parse JSON bodies
app.use(express.json());

// Routes
app.use('/spotify', spotifyRoutes);

// Main page route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use(errorHandler);

// Check if port is in use and try next available port
const server = app.listen(PORT)
    .on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${PORT} is busy, trying ${PORT + 1}...`);
            server.listen(PORT + 1);
        } else {
            console.error('Server error:', err);
        }
    })
    .on('listening', () => {
        const address = server.address();
        console.log(`Server is running on http://localhost:${address.port}`);
    }); 