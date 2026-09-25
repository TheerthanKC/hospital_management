// ==========================================
// 1. AUTHENTICATION CHECK
// ==========================================
const currentUser = JSON.parse(localStorage.getItem('medilink_user'));
const currentPage = window.location.pathname;

// Protect dashboard pages - redirect to login if not authenticated
if (!currentUser && !currentPage.includes('login.html')) {
    window.location.href = '/login.html';
}
// Redirect logged-in users away from the login page
if (currentUser && currentPage.includes('login.html')) {
    window.location.href = '/index.html';
}

// ==========================================
// 2. DYNAMIC NAVBAR WITH PROFILE DROPDOWN
// ==========================================
const navContainer = document.getElementById('navbar-container');
if (navContainer && currentUser) {
    const userInitial = currentUser.username.charAt(0).toUpperCase();

    const doctorLinks = `
        <a href="/doctor-dashboard.html">Doctor Dashboard</a>
        <a href="/add-record.html">Add Record</a>
    `;
    const patientLinks = `
        <a href="/patient-dashboard.html">Patient Dashboard</a>
        <a href="/book-appointment.html">Book Appointment</a>
    `;

    navContainer.innerHTML = `
        <nav class="navbar">
            <div class="logo">MediLink</div>
            <div class="links">
                <a href="/index.html">Home</a>
                ${currentUser.role === 'doctor' ? doctorLinks : ''}
                ${currentUser.role === 'patient' ? patientLinks : ''}
                <div class="profile-dropdown">
                    <div class="profile-circle" id="profile-btn">${userInitial}</div>
                    <div class="dropdown-menu" id="dropdown-menu">
                        <div class="dropdown-header">
                            <strong>${currentUser.username}</strong>
                            <span>${currentUser.role}</span>
                        </div>
                        <a href="#" class="dropdown-item" id="logout-btn">Log Out</a>
                    </div>
                </div>
            </div>
        </nav>
    `;

    // Dropdown toggle logic
    const profileBtn = document.getElementById('profile-btn');
    const dropdownMenu = document.getElementById('dropdown-menu');
    profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('active');
    });
    document.addEventListener('click', (e) => {
        if (!profileBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.remove('active');
        }
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('medilink_user');
        window.location.href = '/login.html';
    });
}

// Show the patient's UID on their dashboard, if present
const uidDisplay = document.getElementById('patient-uid');
if (uidDisplay && currentUser && currentUser.uid) {
    uidDisplay.textContent = `Patient ID: ${currentUser.uid}`;
}

// ==========================================
// 3. LOGIN LOGIC
// ==========================================
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        const msgDiv = document.getElementById('login-msg');

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('medilink_user', JSON.stringify(data.user));
                window.location.href = '/index.html';
            } else {
                msgDiv.innerHTML = `<span class="error-msg">${data.error}</span>`;
            }
        } catch (error) {
            msgDiv.innerHTML = `<span class="error-msg">Server error. Try again.</span>`;
        }
    });
}

// ==========================================
// 4. REGISTER LOGIC
// ==========================================
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('reg-username').value;
        const password = document.getElementById('reg-password').value;
        const role = document.getElementById('reg-role').value;
        const msgDiv = document.getElementById('reg-msg');

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, role })
            });
            const data = await response.json();

            if (response.ok) {
                msgDiv.innerHTML = `<span class="success-msg">Account created! Please sign in.</span>`;
                registerForm.reset();
            } else {
                msgDiv.innerHTML = `<span class="error-msg">${data.error}</span>`;
            }
        } catch (error) {
            msgDiv.innerHTML = `<span class="error-msg">Server error. Try again.</span>`;
        }
    });
}

// ==========================================
// 5. UI TOGGLE (LOGIN / REGISTER VIEW)
// ==========================================
const loginView = document.getElementById('login-view');
const registerView = document.getElementById('register-view');
const btnShowRegister = document.getElementById('show-register');
const btnShowLogin = document.getElementById('show-login');

if (btnShowRegister && btnShowLogin) {
    btnShowRegister.addEventListener('click', () => {
        loginView.classList.add('hidden-view');
        registerView.classList.remove('hidden-view');
        document.getElementById('login-msg').innerHTML = '';
    });
    btnShowLogin.addEventListener('click', () => {
        registerView.classList.add('hidden-view');
        loginView.classList.remove('hidden-view');
        document.getElementById('reg-msg').innerHTML = '';
    });
}

// ==========================================
// 6. RECORD MANAGEMENT
// ==========================================
const addRecordForm = document.getElementById('add-record-form');
if (addRecordForm) {
    addRecordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newRecord = {
            doctorName: currentUser.username,
            patientName: document.getElementById('record-patient-name').value,
            diagnosis: document.getElementById('record-diagnosis').value,
            prescription: document.getElementById('record-prescription').value,
            date: new Date().toLocaleDateString()
        };

        try {
            const response = await fetch('/api/records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRecord)
            });
            if (response.ok) {
                document.getElementById('record-msg').innerHTML = `<span class="success-msg">Record securely saved!</span>`;
                addRecordForm.reset();
            }
        } catch (error) {
            console.error(error);
        }
    });
}

async function loadRecords() {
    try {
        const response = await fetch('/api/records');
        const records = await response.json();

        // Doctor/Admin view: all records
        const allRecordsList = document.getElementById('all-records-list');
        if (allRecordsList) {
            if (records.length === 0) {
                allRecordsList.innerHTML = `<p style="color: var(--text-muted);">No records found.</p>`;
            } else {
                allRecordsList.innerHTML = records.map(r => `
                    <div class="dashboard-card" style="margin-bottom: 12px;">
                        <p><strong>Patient:</strong> ${r.patientName}</p>
                        <p><strong>Diagnosis:</strong> ${r.diagnosis}</p>
                        <p><strong>Prescription:</strong> ${r.prescription}</p>
                        <p style="color: var(--text-muted); font-size: 0.85rem;">Logged by Dr. ${r.doctorName} on ${r.date}</p>
                    </div>
                `).join('');
            }
        }

        // Patient view: only their own records
        const myRecordsList = document.getElementById('my-records-list');
        if (myRecordsList) {
            const myRecords = records.filter(r => r.patientName === currentUser.username);
            if (myRecords.length === 0) {
                myRecordsList.innerHTML = `<p style="color: var(--text-muted);">No medical records on file.</p>`;
            } else {
                myRecordsList.innerHTML = myRecords.map(r => `
                    <div class="dashboard-card" style="margin-bottom: 12px;">
                        <p><strong>Diagnosis:</strong> ${r.diagnosis}</p>
                        <p><strong>Prescription:</strong> ${r.prescription}</p>
                        <p style="color: var(--text-muted); font-size: 0.85rem;">Attending Dr. ${r.doctorName} | Date: ${r.date}</p>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error(error);
    }
}

if (document.getElementById('all-records-list') || document.getElementById('my-records-list')) {
    loadRecords();
}

// ==========================================
// 7. APPOINTMENT LOGIC (BOOKING)
// ==========================================
const apptForm = document.getElementById('appointment-form');
const doctorSelect = document.getElementById('appt-doctor');

if (doctorSelect) {
    fetch('/api/doctors')
        .then(res => res.json())
        .then(doctors => {
            if (doctors.length === 0) {
                doctorSelect.innerHTML = '<option value="" disabled selected>No doctors available</option>';
            } else {
                doctorSelect.innerHTML = '<option value="" disabled selected>Select a doctor...</option>' +
                    doctors.map(d => `<option value="${d.username}">Dr. ${d.username}</option>`).join('');
            }
        })
        .catch(error => console.error(error));
}

if (apptForm) {
    apptForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newAppt = {
            patientName: currentUser.username,
            doctorName: document.getElementById('appt-doctor').value,
            date: document.getElementById('appt-date').value,
            time: document.getElementById('appt-time').value,
            reason: document.getElementById('appt-reason').value
        };

        try {
            const response = await fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAppt)
            });
            if (response.ok) {
                document.getElementById('appt-msg').innerHTML =
                    `<span class="success-msg">Request sent for ${newAppt.date} at ${newAppt.time}. Awaiting doctor's confirmation.</span>`;
                apptForm.reset();
            }
        } catch (error) {
            console.error(error);
        }
    });
}

// ==========================================
// 8. LOAD APPOINTMENTS (DOCTOR DASHBOARD)
// ==========================================
async function loadAppointments() {
    const apptList = document.getElementById('appointment-list');
    if (!apptList) return;

    try {
        const response = await fetch('/api/appointments');
        const allAppointments = await response.json();

        const visibleAppointments = currentUser.role === 'admin'
            ? allAppointments
            : allAppointments.filter(appt => appt.doctorName === currentUser.username);

        const isDoctor = currentUser.role === 'doctor' || currentUser.role === 'admin';

        if (visibleAppointments.length === 0) {
            apptList.innerHTML = `<p style="color: var(--text-muted);">No upcoming appointments.</p>`;
        } else {
            apptList.innerHTML = visibleAppointments.map(appt => `
                <div class="dashboard-card" style="margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap;">
                        <div>
                            ${appt.patientUid ? `<p class="uid-badge">UID: ${appt.patientUid}</p>` : ''}
                            <p><strong>Patient:</strong> ${appt.patientName}</p>
                            <p><strong>Date:</strong> ${appt.date} at ${appt.time}</p>
                            <p><strong>Reason:</strong> ${appt.reason}</p>
                            <p style="color: var(--text-muted); font-size: 0.85rem;">Assigned to: Dr. ${appt.doctorName}</p>
                        </div>
                        <span class="status-badge status-${appt.status}">${appt.status}</span>
                    </div>
                    ${isDoctor && appt.status === 'pending' ? `
                        <div class="appt-actions">
                            <button class="btn-accept" data-id="${appt.id}">Accept</button>
                            <button class="btn-reject" data-id="${appt.id}">Reject</button>
                        </div>
                    ` : ''}
                </div>
            `).join('');
        }
    } catch (error) {
        apptList.innerHTML = `<p class="error-msg">Failed to load appointments.</p>`;
    }
}

if (document.getElementById('appointment-list')) {
    loadAppointments();

    // Accept / Reject buttons (event delegation, since buttons are injected dynamically)
    document.getElementById('appointment-list').addEventListener('click', async (e) => {
        const isAccept = e.target.classList.contains('btn-accept');
        const isReject = e.target.classList.contains('btn-reject');
        if (!isAccept && !isReject) return;

        const id = e.target.getAttribute('data-id');
        const status = isAccept ? 'accepted' : 'rejected';

        try {
            const response = await fetch(`/api/appointments/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (response.ok) {
                loadAppointments(); // refresh list to reflect new status
            }
        } catch (error) {
            console.error(error);
        }
    });
}