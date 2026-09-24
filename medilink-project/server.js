const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Mock Databases
const records = [];
const users = []; // Stores registered users

// --- AUTHENTICATION ENDPOINTS ---

// Register a new user
app.post('/api/register', (req, res) => {
    const { username, password, role } = req.body;
    
    // Check if user already exists
    const userExists = users.find(u => u.username === username);
    if (userExists) {
        return res.status(400).json({ error: 'Username already taken' });
    }

    const newUser = { username, password, role };
    users.push(newUser);
    res.status(201).json({ message: 'Account created successfully', user: newUser });
});

// Login an existing user
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
        return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    res.json({ message: 'Login successful', user });
});

// --- RECORD ENDPOINTS ---
app.get('/api/records', (req, res) => {
    res.json(records);
});

app.post('/api/records', (req, res) => {
    records.push(req.body);
    res.status(201).json({ message: 'Record added successfully' });
});

// --- DEFAULT ROUTE ---
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server securely running on http://localhost:${PORT}`);
});