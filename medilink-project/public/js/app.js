// Dynamically load the navbar on pages that need it
const navbarHTML = `
    <nav class="navbar">
        <div class="logo">MediLink</div>
        <div class="links">
            <a href="/index.html">Home</a>
            <a href="/doctor-dashboard.html">Doctor Dashboard</a>
            <a href="/patient-dashboard.html">Patient Dashboard</a>
            <a href="/add-record.html">Add Record</a>
            <a href="/login.html">Logout</a>
        </div>
    </nav>
`;

// Inject navbar if the container exists
const navContainer = document.getElementById('navbar-container');
if (navContainer) {
    navContainer.innerHTML = navbarHTML;
}

// Example API Fetch (Use this in your dashboard HTML files)
async function fetchRecords() {
    try {
        const response = await fetch('/api/records');
        const data = await response.json();
        console.log("Patient Records:", data);
    } catch (error) {
        console.error("Error fetching records:", error);
    }
}