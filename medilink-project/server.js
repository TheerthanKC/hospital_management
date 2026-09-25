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
const users = [];
const appointments = [];

let appointmentIdCounter = 1;

// Generates a unique patient UID: YYMMDD + 4-digit random number (1-9999)
function generateUID() {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');

    let uid;
    let attempts = 0;
    do {
        const rand = Math.floor(Math.random() * 9999) + 1; // 1 - 9999
        uid = `${yy}${mm}${dd}${String(rand).padStart(4, '0')}`;
        attempts++;
    } while (users.some(u => u.uid === uid) && attempts < 10000);

    return uid;
}

// --- AUTHENTICATION ENDPOINTS ---
app.post('/api/register', (req, res) => {
    const { username, password, role } = req.body;
    const userExists = users.find(u => u.username === username);
    if (userExists) {
        return res.status(400).json({ error: 'Username already taken' });
    }

    const newUser = { username, password, role };

    // Only patients get a UID
    if (role === 'patient') {
        newUser.uid = generateUID();
    }

    users.push(newUser);
    res.status(201).json({ message: 'Account created successfully', user: newUser });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
        return res.status(401).json({ error: 'Invalid username or password' });
    }
    res.json({ message: 'Login successful', user });
});

// --- APPOINTMENT ENDPOINTS ---
app.get('/api/appointments', (req, res) => {
    res.json(appointments);
});

app.get('/api/doctors', (req, res) => {
    const doctors = users.filter(u => u.role === 'doctor' || u.role === 'admin' || u.role === 'medical professional');
    const safeDoctorList = doctors.map(d => ({ username: d.username, role: d.role }));
    res.json(safeDoctorList);
});

app.post('/api/appointments', (req, res) => {
    const patient = users.find(u => u.username === req.body.patientName);

    const newAppointment = {
        id: appointmentIdCounter++,
        patientName: req.body.patientName,
        patientUid: patient ? patient.uid : null,
        doctorName: req.body.doctorName,
        date: req.body.date,
        time: req.body.time,
        reason: req.body.reason,
        status: 'pending' // pending -> accepted / rejected
    };

    appointments.push(newAppointment);
    res.status(201).json({ message: 'Appointment request sent', appointment: newAppointment });
});

// Doctor accepts or rejects a pending appointment
app.patch('/api/appointments/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Status must be "accepted" or "rejected"' });
    }

    const appointment = appointments.find(a => a.id === id);
    if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
    }

    appointment.status = status;
    res.json({ message: `Appointment ${status}`, appointment });
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