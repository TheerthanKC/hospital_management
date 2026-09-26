const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// Serve static files with caching disabled — prevents the browser from running
// a stale cached copy of app.js / style.css after you update them
app.use(express.static(path.join(__dirname, 'public'), {
    etag: false,
    lastModified: false,
    setHeaders: (res) => {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
    }
}));

// Mock Databases
const records = [];
const users = [];
const appointments = [];

let appointmentIdCounter = 1;

// Tracks the next sequence number to use for each day's UID prefix (YYMMDD -> next number)
const uidCounters = {};

// Generates a sequential patient UID: YYMMDD + 4-digit sequence number (0001, 0002, ...)
// The sequence resets back to 0001 each new day.
function generateUID() {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const datePrefix = `${yy}${mm}${dd}`;

    if (!uidCounters[datePrefix]) {
        uidCounters[datePrefix] = 1;
    }

    const sequence = uidCounters[datePrefix];
    uidCounters[datePrefix]++;

    return `${datePrefix}${String(sequence).padStart(4, '0')}`;
}

// --- AUTHENTICATION ENDPOINTS ---
app.post('/api/register', (req, res) => {
    const { username, password, role } = req.body;
    const userExists = users.find(u => u.username === username);
    if (userExists) {
        return res.status(400).json({ error: 'Username already taken' });
    }

    const newUser = { username, password, role, joinedDate: new Date().toLocaleDateString() };

    // Patients AND doctors get a UID (needed for appointment/record audit trails)
    if (role === 'patient' || role === 'doctor') {
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

    // Backfill: fix any patient/doctor account created before UIDs existed
    if ((user.role === 'patient' || user.role === 'doctor') && !user.uid) {
        user.uid = generateUID();
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

// Look up a patient by their UID (used by the "Add Record" form to auto-fill the name,
// since usernames aren't guaranteed unique)
app.get('/api/patient-by-uid/:uid', (req, res) => {
    const patient = users.find(u => u.uid === req.params.uid && u.role === 'patient');
    if (!patient) {
        return res.status(404).json({ error: 'No patient found with that UID' });
    }
    res.json({ username: patient.username, uid: patient.uid });
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

    // Look up the doctor's UID for the audit trail
    const doctor = users.find(u => u.username === appointment.doctorName);

    // Auto-generate an acceptance/rejection letter, stored alongside manual records
    records.push({
        type: 'appointment-status',
        status: appointment.status,
        doctorName: appointment.doctorName,
        doctorUid: doctor ? doctor.uid : null,
        patientName: appointment.patientName,
        patientUid: appointment.patientUid,
        reason: appointment.reason,
        date: new Date().toLocaleDateString()
    });

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