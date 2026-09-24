// 1. AUTHENTICATION GUARD (Protects pages from unauthorized access)
const currentPage = window.location.pathname;
const currentUser = JSON.parse(localStorage.getItem('medilink_user'));

// If user is NOT logged in and NOT on the login page, redirect them to login
if (!currentUser && !currentPage.includes('login.html')) {
    window.location.href = '/login.html';
}

// If user IS logged in but tries to go to login page, send them to dashboard
if (currentUser && currentPage.includes('login.html')) {
    window.location.href = '/index.html';
}

// 2. DYNAMIC NAVBAR (Only inject if logged in)
const navContainer = document.getElementById('navbar-container');
if (navContainer && currentUser) {
    // Get the first letter of the username for the profile icon
    const userInitial = currentUser.username.charAt(0).toUpperCase();

    navContainer.innerHTML = `
        <nav class="navbar">
            <div class="logo">MediLink</div>
            <div class="links">
                <a href="/index.html">Home</a>
                ${currentUser.role === 'doctor' ? '<a href="/doctor-dashboard.html">Doctor Dashboard</a>' : ''}
                ${currentUser.role === 'doctor' ? '<a href="/add-record.html">Add Record</a>' : ''}
                ${currentUser.role === 'patient' ? '<a href="/patient-dashboard.html">Patient Dashboard</a>' : ''}
                ${currentUser.role === 'patient' ? '<a href="/book-appointment.html">Book Appointment</a>' : ''}
                
                <!-- Modern Circular Profile & Dropdown -->
                <div class="profile-dropdown">
                    <div class="profile-circle" id="profile-btn">${userInitial}</div>
                    
                    <div class="dropdown-menu" id="dropdown-menu">
                        <div class="dropdown-header">
                            <strong>${currentUser.username}</strong>
                            <span>${currentUser.role}</span>
                        </div>
                        <a href="#" id="logout-btn" class="dropdown-item">Log Out</a>
                    </div>
                </div>
            </div>
        </nav>
    `;

    // Dropdown Toggle Logic
    const profileBtn = document.getElementById('profile-btn');
    const dropdownMenu = document.getElementById('dropdown-menu');
    
    profileBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent click from bubbling up to the document
        dropdownMenu.classList.toggle('active');
    });

    // Close dropdown if the user clicks anywhere else on the page
    document.addEventListener('click', (e) => {
        if (!profileBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.remove('active');
        }
    });

    // Handle Logout
    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('medilink_user'); // Delete session
        window.location.href = '/login.html';     // Kick back to login
    });
}

// 3. LOGIN LOGIC
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
                // Store user data in the browser's Local Storage (on the device)
                localStorage.setItem('medilink_user', JSON.stringify(data.user));
                window.location.href = '/index.html'; // Redirect to home
            } else {
                msgDiv.innerHTML = `<span class="error-msg">${data.error}</span>`;
            }
        } catch (error) {
            console.error(error);
        }
    });
}

// 4. REGISTRATION LOGIC
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
                msgDiv.innerHTML = `<span class="success-msg">Account created! You can now log in above.</span>`;
                registerForm.reset();
            } else {
                msgDiv.innerHTML = `<span class="error-msg">${data.error}</span>`;
            }
        } catch (error) {
            console.error(error);
        }
    });
}
// --- 5. UI TOGGLE LOGIC FOR LOGIN/REGISTER ---
const loginView = document.getElementById('login-view');
const registerView = document.getElementById('register-view');
const btnShowRegister = document.getElementById('show-register');
const btnShowLogin = document.getElementById('show-login');

if (btnShowRegister && btnShowLogin) {
    // Switch to Register Form
    btnShowRegister.addEventListener('click', () => {
        loginView.classList.add('hidden-view');
        registerView.classList.remove('hidden-view');
        document.getElementById('login-msg').innerHTML = ''; // Clear old errors
    });

    // Switch to Login Form
    btnShowLogin.addEventListener('click', () => {
        registerView.classList.add('hidden-view');
        loginView.classList.remove('hidden-view');
        document.getElementById('reg-msg').innerHTML = ''; // Clear old errors
    });
}
// --- 6. RECORD MANAGEMENT LOGIC ---

// A. Add a New Record (Doctor Only)
const addRecordForm = document.getElementById('add-record-form');
if (addRecordForm) {
    addRecordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Grab values from the HTML inputs
        const patientName = document.getElementById('record-patient-name').value;
        const diagnosis = document.getElementById('record-diagnosis').value;
        const prescription = document.getElementById('record-prescription').value;
        const msgDiv = document.getElementById('record-msg');

        // Construct the record object (automatically attaching the logged-in doctor's name)
        const newRecord = {
            doctorName: currentUser.username,
            patientName: patientName,
            diagnosis: diagnosis,
            prescription: prescription,
            date: new Date().toLocaleDateString()
        };

        try {
            const response = await fetch('/api/records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRecord)
            });
            
            if (response.ok) {
                msgDiv.innerHTML = `<span class="success-msg">Record securely saved!</span>`;
                addRecordForm.reset();
            }
        } catch (error) {
            console.error("Error saving record:", error);
        }
    });
}

// B. Fetch and Display Records
async function loadRecords() {
    try {
        const response = await fetch('/api/records');
        const records = await response.json();

        // 1. Doctor View: Show all records in the database
        const allRecordsList = document.getElementById('all-records-list');
        if (allRecordsList) {
            if (records.length === 0) {
                allRecordsList.innerHTML = `<p style="color: var(--text-muted);">No records found in the database yet.</p>`;
            } else {
                allRecordsList.innerHTML = records.map(r => `
                    <div style="border-left: 4px solid var(--primary); padding: 15px; margin-bottom: 12px; background: #f8fafc; border-radius: 6px;">
                        <strong>Patient:</strong> ${r.patientName} <br>
                        <strong>Diagnosis:</strong> ${r.diagnosis} <br>
                        <strong>Prescription:</strong> ${r.prescription} <br>
                        <small style="color: var(--text-muted);">Logged by Dr. ${r.doctorName} on ${r.date}</small>
                    </div>
                `).join('');
            }
        }

        // 2. Patient View: Show ONLY records matching their username
        const myRecordsList = document.getElementById('my-records-list');
        if (myRecordsList) {
            const myRecords = records.filter(r => r.patientName === currentUser.username);
            
            if (myRecords.length === 0) {
                myRecordsList.innerHTML = `<p style="color: var(--text-muted);">You have no medical records on file.</p>`;
            } else {
                myRecordsList.innerHTML = myRecords.map(r => `
                    <div style="border-left: 4px solid var(--secondary); padding: 15px; margin-bottom: 12px; background: #f8fafc; border-radius: 6px;">
                        <strong>Diagnosis:</strong> ${r.diagnosis} <br>
                        <strong>Prescription:</strong> ${r.prescription} <br>
                        <small style="color: var(--text-muted);">Attending Dr. ${r.doctorName} | Date: ${r.date}</small>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error("Error loading records:", error);
    }
}

// Trigger the fetch automatically if a list container exists on the current page
if (document.getElementById('all-records-list') || document.getElementById('my-records-list')) {
    loadRecords();
}

// --- 7. APPOINTMENT LOGIC ---
const apptForm = document.getElementById('appointment-form');
const doctorSelect = document.getElementById('appt-doctor');

// A. Load doctors into the dropdown automatically when the page opens
if (doctorSelect) {
    fetch('/api/doctors')
        .then(response => response.json())
        .then(doctors => {
            if (doctors.length === 0) {
                doctorSelect.innerHTML = '<option value="" disabled selected>No doctors currently available</option>';
            } else {
                // Populate the dropdown with fetched doctors
                doctorSelect.innerHTML = '<option value="" disabled selected>Select a doctor...</option>' + 
                    doctors.map(d => `<option value="${d.username}">Dr. ${d.username}</option>`).join('');
            }
        })
        .catch(error => console.error("Error fetching doctors:", error));
}

// B. Submit the appointment form to the backend
if (apptForm) {
    apptForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const doctorName = document.getElementById('appt-doctor').value;
        const date = document.getElementById('appt-date').value;
        const time = document.getElementById('appt-time').value;
        const reason = document.getElementById('appt-reason').value;
        const msgDiv = document.getElementById('appt-msg');

        const newAppt = {
            patientName: currentUser.username,
            doctorName: doctorName,
            date: date,
            time: time,
            reason: reason
        };

        try {
            const response = await fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAppt)
            });
            
            if (response.ok) {
                msgDiv.innerHTML = `<span class="success-msg">Success! Your appointment with Dr. ${doctorName} is booked for ${date} at ${time}.</span>`;
                apptForm.reset();
            }
        } catch (error) {
            console.error("Error booking appointment:", error);
        }
    });
}