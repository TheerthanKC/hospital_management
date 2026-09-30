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
// 1b. THEME (applied immediately, on every page, to avoid a flash)
// ==========================================
(function initTheme() {
    const savedTheme = localStorage.getItem('medilink_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
})();

// ==========================================
// 1c. GLOBAL MODAL (used for "View Profile" and "Help & Support")
// ==========================================
function ensureModal() {
    if (document.getElementById('app-modal-overlay')) return;
    document.body.insertAdjacentHTML('beforeend', `
        <div class="modal-overlay" id="app-modal-overlay">
            <div class="modal-box">
                <button class="modal-close" id="modal-close-btn" aria-label="Close">&times;</button>
                <div id="modal-content-area"></div>
            </div>
        </div>
    `);
    const overlay = document.getElementById('app-modal-overlay');
    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
}

function openModal(contentHtml) {
    ensureModal();
    document.getElementById('modal-content-area').innerHTML = contentHtml;
    document.getElementById('app-modal-overlay').classList.add('active');
}

function closeModal() {
    const overlay = document.getElementById('app-modal-overlay');
    if (overlay) overlay.classList.remove('active');
}

function showProfileModal() {
    const userInitial = currentUser.username.charAt(0).toUpperCase();
    openModal(`
        <h2 style="margin-bottom: 20px;">My Profile</h2>
        <div class="profile-modal-avatar">${userInitial}</div>
        <div class="profile-modal-row"><span>Username</span><strong>${currentUser.username}</strong></div>
        <div class="profile-modal-row"><span>Role</span><strong style="text-transform: capitalize;">${currentUser.role}</strong></div>
        ${currentUser.uid ? `<div class="profile-modal-row"><span>Unique ID</span><strong>${currentUser.uid}</strong></div>` : ''}
        <div class="profile-modal-row"><span>Member Since</span><strong>${currentUser.joinedDate || 'N/A'}</strong></div>
    `);
}

function showHelpModal() {
    openModal(`
        <h2 style="margin-bottom: 20px;">Help &amp; Support</h2>
        <p style="color: var(--text-muted); margin-bottom: 16px;">Need a hand with MediLink? Reach out any time.</p>
        <div class="profile-modal-row"><span>Email</span><strong>support@medilink.example</strong></div>
        <div class="profile-modal-row"><span>Hours</span><strong>Mon–Fri, 9am–6pm</strong></div>
        <div class="profile-modal-row"><span>Emergency?</span><strong>Call your local emergency number</strong></div>
    `);
}

// ==========================================
// 2. DYNAMIC NAVBAR WITH PROFILE DROPDOWN
// ==========================================
const navContainer = document.getElementById('navbar-container');
if (navContainer && currentUser) {
    const userInitial = currentUser.username.charAt(0).toUpperCase();

    const isActive = (href) => currentPage.includes(href) ? ' class="active"' : '';

    const doctorLinks = `
        <a href="/doctor-dashboard.html"${isActive('doctor-dashboard')}>Dashboard</a>
        <a href="/add-record.html"${isActive('add-record')}>Records</a>
    `;
    const patientLinks = `
        <a href="/patient-dashboard.html"${isActive('patient-dashboard')}>Dashboard</a>
        <a href="/book-appointment.html"${isActive('book-appointment')}>Book Appointment</a>
    `;

    navContainer.innerHTML = `
        <nav class="navbar">
            <div class="logo">🩺 MediLink</div>
            <div class="links">
                <a href="/index.html"${isActive('index')}>Home</a>
                ${currentUser.role === 'doctor' ? doctorLinks : ''}
                ${currentUser.role === 'patient' ? patientLinks : ''}
                <div class="profile-dropdown">
                    <div class="profile-circle" id="profile-btn">${userInitial}</div>
                    <div class="dropdown-menu" id="dropdown-menu">
                        <div class="dropdown-header">
                            <div class="dropdown-avatar">${userInitial}</div>
                            <div>
                                <strong>${currentUser.username}</strong>
                                <span>${currentUser.role}</span>
                            </div>
                        </div>
                        ${currentUser.uid ? `<div class="dropdown-uid">UID: ${currentUser.uid}</div>` : ''}
                        <div class="dropdown-divider"></div>
                        <a href="#" class="dropdown-item" id="view-profile-btn"><span class="item-icon">👤</span> View Full Profile</a>
                        <div class="dropdown-item theme-toggle-row">
                            <span><span class="item-icon">🌙</span> Dark Mode</span>
                            <label class="switch">
                                <input type="checkbox" id="theme-toggle-checkbox">
                                <span class="slider"></span>
                            </label>
                        </div>
                        <a href="#" class="dropdown-item" id="help-btn"><span class="item-icon">💬</span> Help &amp; Support</a>
                        <div class="dropdown-divider"></div>
                        <a href="#" class="dropdown-item logout-item" id="logout-btn"><span class="item-icon">🚪</span> Log Out</a>
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

    // View Full Profile
    document.getElementById('view-profile-btn').addEventListener('click', (e) => {
        e.preventDefault();
        dropdownMenu.classList.remove('active');
        showProfileModal();
    });

    // Help & Support
    document.getElementById('help-btn').addEventListener('click', (e) => {
        e.preventDefault();
        dropdownMenu.classList.remove('active');
        showHelpModal();
    });

    // Dark mode toggle
    const themeCheckbox = document.getElementById('theme-toggle-checkbox');
    themeCheckbox.checked = document.documentElement.getAttribute('data-theme') === 'dark';
    themeCheckbox.addEventListener('change', () => {
        const newTheme = themeCheckbox.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('medilink_theme', newTheme);
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('medilink_user');
        window.location.href = '/login.html';
    });
}

// ==========================================
// 2b. FOOTER (injected on every page except login)
// ==========================================
function renderFooter() {
    if (!currentUser || currentPage.includes('login.html')) return;
    if (document.querySelector('.site-footer')) return;

    // Only show the dashboard link that matches the logged-in role
    const dashboardLink = currentUser.role === 'patient'
        ? '<a href="/patient-dashboard.html">Patient dashboard</a>'
        : '<a href="/doctor-dashboard.html">Doctor dashboard</a>';

    const footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML = `
        <div class="footer-inner">
            <div>
                <div class="footer-logo">&#129658; MediLink</div>
                <p>Appointments, records and care, kept in one secure place.</p>
            </div>
            <nav aria-label="Footer">
                <a href="/index.html">Home</a>
                ${dashboardLink}
                <a href="#" id="footer-help">Help and support</a>
            </nav>
            <p class="footer-emergency">In an emergency, call your local emergency number.</p>
        </div>
        <div class="footer-copy">&copy; ${new Date().getFullYear()} MediLink. All rights reserved.</div>
    `;
    document.body.appendChild(footer);

    document.getElementById('footer-help').addEventListener('click', (e) => {
        e.preventDefault();
        showHelpModal();
    });
}
renderFooter();

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

// --- Patient UID lookup for the Add Record form ---
// Since usernames aren't unique, doctors identify patients by UID; the name is auto-filled.
const recordUidInput = document.getElementById('record-patient-uid');
const recordNameDisplay = document.getElementById('record-patient-name-display');
let resolvedPatientName = null;

if (recordUidInput) {
    recordUidInput.addEventListener('input', async () => {
        const uid = recordUidInput.value.trim();
        resolvedPatientName = null;

        if (uid.length === 0) {
            recordNameDisplay.innerHTML = '';
            return;
        }

        try {
            const response = await fetch(`/api/patient-by-uid/${encodeURIComponent(uid)}`);
            const data = await response.json();

            if (response.ok) {
                resolvedPatientName = data.username;
                recordNameDisplay.innerHTML = `<span class="success-msg">Patient found: ${data.username}</span>`;
            } else {
                recordNameDisplay.innerHTML = `<span class="error-msg">${data.error}</span>`;
            }
        } catch (error) {
            recordNameDisplay.innerHTML = `<span class="error-msg">Lookup failed. Try again.</span>`;
        }
    });
}

const addRecordForm = document.getElementById('add-record-form');
if (addRecordForm) {
    addRecordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const msgDiv = document.getElementById('record-msg');

        if (!resolvedPatientName) {
            msgDiv.innerHTML = `<span class="error-msg">Enter a valid patient UID before saving.</span>`;
            return;
        }

        const newRecord = {
            type: 'diagnosis',
            doctorName: currentUser.username,
            patientName: resolvedPatientName,
            patientUid: recordUidInput.value.trim(),
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
                msgDiv.innerHTML = `<span class="success-msg">Record securely saved!</span>`;
                addRecordForm.reset();
                recordNameDisplay.innerHTML = '';
                resolvedPatientName = null;
            }
        } catch (error) {
            console.error(error);
        }
    });
}

// --- Restricted view: Doctor Dashboard's "Patient Appointment History" ---
// Only shows this doctor's own accepted/rejected appointment letters
async function loadAppointmentHistory() {
    const historyList = document.getElementById('appointment-history-list');
    if (!historyList) return;

    try {
        const response = await fetch('/api/records');
        const records = await response.json();

        const myHistory = records.filter(
            r => r.type === 'appointment-status' && r.doctorName === currentUser.username
        );

        if (myHistory.length === 0) {
            historyList.innerHTML = `<p style="color: var(--text-muted);">No appointment history yet.</p>`;
        } else {
            renderPaginated(historyList, myHistory.slice().reverse(), renderAppointmentLetter);
        }
    } catch (error) {
        console.error(error);
    }
}

// --- Global view: "Records" page — all manual records + ALL doctors' accept/reject letters ---
async function loadAllRecords() {
    const allRecordsList = document.getElementById('all-records-list');
    if (!allRecordsList) return;

    try {
        const response = await fetch('/api/records');
        const records = await response.json();

        if (records.length === 0) {
            allRecordsList.innerHTML = `<p style="color: var(--text-muted);">No records found.</p>`;
        } else {
            // Newest first, 5 per page
            renderPaginated(allRecordsList, records.slice().reverse(), r =>
                r.type === 'appointment-status' ? renderAppointmentLetter(r) : renderDiagnosisRecord(r)
            );
        }
    } catch (error) {
        console.error(error);
    }
}

// ==========================================
// Shared record-card helpers
// ==========================================
const RECORDS_PER_PAGE = 5;

// Escape user-supplied text before putting it into innerHTML
function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
    ));
}

// "14:30" -> "2:30 PM"
function formatTime12(t) {
    if (!t) return null;
    const [h, m] = String(t).split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return t;
    return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function detailRow(label, value) {
    return `<div class="record-detail-row"><span>${label}</span><strong>${value}</strong></div>`;
}

// Small collapsed box; clicking the summary expands it to show every detail
function renderRecordCard({ patientName, patientUid, subtitle, badgeText, badgeClass, detailsHtml }) {
    return `
        <div class="record-card">
            <button type="button" class="record-summary" aria-expanded="false">
                <div class="record-summary-main">
                    <div class="record-title-row">
                        <span class="record-title">${esc(patientName)}</span>
                        ${patientUid ? `<span class="uid-badge">UID: ${esc(patientUid)}</span>` : ''}
                    </div>
                    <span class="record-sub">${subtitle}</span>
                </div>
                <span class="status-badge ${badgeClass}">${esc(badgeText)}</span>
                <span class="record-chevron" aria-hidden="true">&#9660;</span>
            </button>
            <div class="record-details">
                <div class="record-details-inner">
                    <div class="record-details-body">${detailsHtml}</div>
                </div>
            </div>
        </div>
    `;
}

function renderAppointmentLetter(r) {
    const time = formatTime12(r.appointmentTime);
    const visit = [time ? `&#128337; ${esc(time)}` : null, r.appointmentDate ? esc(r.appointmentDate) : null]
        .filter(Boolean).join(' &middot; ') || 'Time not recorded';

    return renderRecordCard({
        patientName: r.patientName,
        patientUid: r.patientUid,
        subtitle: visit,
        badgeText: r.status,
        badgeClass: `status-${r.status}`,
        detailsHtml: `
            ${detailRow('Result', r.status === 'accepted' ? 'Appointment Accepted' : 'Appointment Rejected')}
            ${detailRow('Patient', esc(r.patientName))}
            ${detailRow('Patient UID', esc(r.patientUid || 'N/A'))}
            ${detailRow('Doctor', 'Dr. ' + esc(r.doctorName))}
            ${detailRow('Appointment date', esc(r.appointmentDate || 'N/A'))}
            ${detailRow('Appointment time', esc(time || 'N/A'))}
            ${detailRow('Reason for visit', esc(r.reason))}
            ${detailRow('Decision made on', esc(r.date))}
        `
    });
}

function renderDiagnosisRecord(r) {
    return renderRecordCard({
        patientName: r.patientName,
        patientUid: r.patientUid,
        subtitle: `Diagnosis: ${esc(r.diagnosis)}`,
        badgeText: 'Diagnosis',
        badgeClass: 'status-diagnosis',
        detailsHtml: `
            ${detailRow('Patient', esc(r.patientName))}
            ${detailRow('Patient UID', esc(r.patientUid || 'N/A'))}
            ${detailRow('Diagnosis', esc(r.diagnosis))}
            ${detailRow('Prescription', esc(r.prescription))}
            ${detailRow('Logged by', 'Dr. ' + esc(r.doctorName))}
            ${detailRow('Date', esc(r.date))}
        `
    });
}

// Expand / collapse a record card (one listener handles every list on the page)
document.addEventListener('click', (e) => {
    const summary = e.target.closest('.record-summary');
    if (!summary) return;
    const card = summary.closest('.record-card');
    const isOpen = card.classList.toggle('open');
    summary.setAttribute('aria-expanded', String(isOpen));
});

// Page numbers with ellipsis, e.g. 1 ... 4 [5] 6 ... 12
function buildPageList(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages = new Set([1, total, current - 1, current, current + 1]);
    if (current <= 3) [2, 3, 4].forEach(p => pages.add(p));
    if (current >= total - 2) [total - 1, total - 2, total - 3].forEach(p => pages.add(p));
    const sorted = [...pages].filter(p => p >= 1 && p <= total).sort((x, y) => x - y);
    const out = [];
    sorted.forEach((p, i) => {
        if (i > 0 && p - sorted[i - 1] > 1) out.push('...');
        out.push(p);
    });
    return out;
}

// Renders one page of items into `container`, with a page-number bar underneath
function renderPaginated(container, items, renderItem, page = 1) {
    const totalPages = Math.max(1, Math.ceil(items.length / RECORDS_PER_PAGE));
    page = Math.min(Math.max(1, page), totalPages);

    const slice = items.slice((page - 1) * RECORDS_PER_PAGE, page * RECORDS_PER_PAGE);
    let html = slice.map(renderItem).join('');

    if (totalPages > 1) {
        const buttons = buildPageList(page, totalPages).map(p =>
            p === '...'
                ? `<span class="page-ellipsis">&hellip;</span>`
                : `<button type="button" class="page-btn${p === page ? ' active' : ''}" data-page="${p}">${p}</button>`
        ).join('');
        html += `
            <div class="pagination">
                <button type="button" class="page-btn page-nav" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''}>&lsaquo; Prev</button>
                ${buttons}
                <button type="button" class="page-btn page-nav" data-page="${page + 1}" ${page === totalPages ? 'disabled' : ''}>Next &rsaquo;</button>
            </div>
        `;
    }

    container.innerHTML = html;

    container.querySelectorAll('.page-btn[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
            renderPaginated(container, items, renderItem, parseInt(btn.dataset.page, 10));
        });
    });
}

// --- Patient view: their own diagnosis records only ---
async function loadMyRecords() {
    const myRecordsList = document.getElementById('my-records-list');
    if (!myRecordsList) return;

    try {
        const response = await fetch('/api/records');
        const records = await response.json();

        // Match by UID, not username — usernames aren't guaranteed unique
        const myRecords = records.filter(r => r.type !== 'appointment-status' && r.patientUid === currentUser.uid);
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
    } catch (error) {
        console.error(error);
    }
}

if (document.getElementById('appointment-history-list')) loadAppointmentHistory();
if (document.getElementById('all-records-list')) loadAllRecords();
if (document.getElementById('my-records-list')) loadMyRecords();

// ==========================================
// 6b. MY APPOINTMENT STATUS (PATIENT DASHBOARD)
// ==========================================
async function loadMyAppointments() {
    const myApptList = document.getElementById('my-appointments-list');
    if (!myApptList) return;

    try {
        const response = await fetch('/api/appointments');
        const allAppointments = await response.json();
        // Match by UID, not username — usernames aren't guaranteed unique
        const myAppointments = allAppointments.filter(a => a.patientUid === currentUser.uid);

        if (myAppointments.length === 0) {
            myApptList.innerHTML = `<p style="color: var(--text-muted);">You haven't requested any appointments yet.</p>`;
        } else {
            myApptList.innerHTML = myAppointments.map(appt => `
                <div class="dashboard-card" style="margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap;">
                        <div>
                            <p><strong>Doctor:</strong> Dr. ${appt.doctorName}</p>
                            <p><strong>Date:</strong> ${appt.date} at ${appt.time}</p>
                            <p><strong>Reason:</strong> ${appt.reason}</p>
                        </div>
                        <span class="status-badge status-${appt.status}">${appt.status}</span>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        myApptList.innerHTML = `<p class="error-msg">Failed to load your appointments.</p>`;
    }
}

if (document.getElementById('my-appointments-list')) {
    loadMyAppointments();
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