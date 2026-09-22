// server.js
const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON and securing headers
app.use(express.json());
app.use(cors());

// Serve static frontend files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Mock Database (In a real app, connect this to MongoDB/PostgreSQL)
const records = [];

// API Endpoints
app.get('/api/records', (req, res) => {
    res.json(records);
});

app.post('/api/records', (req, res) => {
    const newRecord = req.body;
    // Input validation & sanitization should happen here
    records.push(newRecord);
    res.status(201).json({ message: 'Record added successfully' });
});

// Fallback route to serve the homepage
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server securely running on http://localhost:${PORT}`);
});