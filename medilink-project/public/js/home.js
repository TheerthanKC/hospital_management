(function () {
    // app.js defines currentUser (and redirects to login when missing)
    if (typeof currentUser === 'undefined' || !currentUser) return;

    const isDoctor = currentUser.role === 'doctor' || currentUser.role === 'admin';
    const $ = (s) => document.querySelector(s);
    const safe = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const BOOK = '/book-appointment.html';
    const fmt = (min) => `${((Math.floor(min / 60) + 11) % 12) + 1}:${String(min % 60).padStart(2, '0')} ${min >= 720 ? 'PM' : 'AM'}`;

    // ---------- SAMPLE DATA (swap for real API data later) ----------
    const DOCTORS = [
        { name: 'Ananya Rao',      spec: 'General physician', years: 12, rating: 4.9, reviews: 812,  slot: 570, hue: 250 },
        { name: 'Rohan Mehta',     spec: 'Cardiology',        years: 15, rating: 4.8, reviews: 640,  slot: 615, hue: 340 },
        { name: 'Priya Nair',      spec: 'Dermatology',       years: 9,  rating: 4.9, reviews: 530,  slot: 660, hue: 160 },
        { name: 'Sneha Kulkarni',  spec: 'Gynecology',        years: 13, rating: 4.9, reviews: 915,  slot: 735, hue: 290 },
        { name: 'Imran Sheikh',    spec: 'Pediatrics',        years: 11, rating: 4.7, reviews: 455,  slot: 870, hue: 30  },
        { name: 'Kavya Iyer',      spec: 'Psychiatry',        years: 8,  rating: 4.8, reviews: 388,  slot: 915, hue: 200 },
        { name: 'Arjun Menon',     spec: 'Orthopedics',       years: 14, rating: 4.8, reviews: 702,  slot: 960, hue: 10  },
        { name: 'Vikram Shetty',   spec: 'General physician', years: 18, rating: 4.7, reviews: 1204, slot: 1020, hue: 220 }
    ];

    const OFFERS = [
        { label: 'Offer', title: 'Free flu shot week', text: 'Walk in at any partner clinic and get your seasonal vaccination at no cost.', cta: 'Get the voucher', code: 'FLU26', icon: '💉', bg: 'linear-gradient(120deg,#4f46e5,#7c3aed)' },
        { label: 'Health package', title: 'Full-body checkup, 30% off', text: '60+ tests, a doctor consultation and a same-day summary report.', cta: 'See the package', code: 'FULL30', icon: '🩺', bg: 'linear-gradient(120deg,#0284c7,#4f46e5)' },
        { label: 'Sponsored', title: 'Free medicine delivery', text: 'GreenLeaf Pharmacy delivers your first prescription order at no charge.', cta: 'Get the code', code: 'LEAF1', icon: '💊', bg: 'linear-gradient(120deg,#047857,#0d9488)' },
        { label: 'New', title: 'Talk to a doctor tonight', text: 'Video consults with general physicians, open until midnight.', cta: 'Learn more', code: 'TELE', icon: '📱', bg: 'linear-gradient(120deg,#be185d,#7c3aed)' }
    ];

    const READS = [
        { tag: 'Family health', title: 'Seasonal flu: when a fever needs a doctor', min: 4, icon: '🤒', hue: 45 },
        { tag: 'Heart health',  title: 'Five habits that lower blood pressure without medication', min: 6, icon: '❤️', hue: 350 },
        { tag: 'Wellness',      title: 'Screen time and sleep: a simple evening routine', min: 3, icon: '😴', hue: 250 },
        { tag: 'Know your tests', title: 'Reading your lab report: what the numbers mean', min: 5, icon: '🧪', hue: 170 }
    ];

    // ---------- HERO ----------
    const hour = new Date().getHours();
    const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    $('#hero-title').textContent = `${greet}, ${currentUser.username}`;
    $('#hero-sub').textContent = isDoctor
        ? 'Review appointment requests and keep patient records up to date.'
        : 'Find a specialist, book a visit and keep your records in one place.';

    // Personal note from real appointment data
    fetch('/api/appointments').then(r => r.json()).then(list => {
        const note = $('#hero-note');
        if (isDoctor) {
            const n = list.filter(a => a.doctorName === currentUser.username && a.status === 'pending').length;
            note.textContent = n ? `${n} appointment request${n > 1 ? 's are' : ' is'} waiting for your reply.` : 'No pending requests right now.';
        } else {
            const when = (a) => new Date(`${a.date}T${a.time}`);
            const next = list.filter(a => a.patientUid === currentUser.uid && a.status === 'accepted' && when(a) >= new Date())
                             .sort((a, b) => when(a) - when(b))[0];
            note.textContent = next
                ? `Your next visit is on ${next.date} at ${fmt(parseInt(next.time) * 60 + parseInt(next.time.split(':')[1]))} with Dr. ${next.doctorName}.`
                : 'You have no upcoming visits. Book one below.';
        }
        note.hidden = false;
    }).catch(() => {});

    if (isDoctor) {
        // Doctors don't need doctor recommendations
        ['#doctor-search', '#hero-chips', '#openings-panel', '#doctors'].forEach(s => $(s).hidden = true);
        $('#hero').classList.add('hero-single');
    }

    // ---------- OFFER CAROUSEL ----------
    const track = $('#carousel-track'), dotsBox = $('#carousel-dots');
    track.innerHTML = OFFERS.map((o, i) => `
        <article class="slide" style="background:${o.bg}" aria-roledescription="slide" aria-label="${i + 1} of ${OFFERS.length}">
            <div class="slide-copy">
                <span class="ad-label ad-on-dark">${safe(o.label)}</span>
                <h2>${safe(o.title)}</h2>
                <p>${safe(o.text)}</p>
                <button type="button" class="btn-light" data-offer="${i}">${safe(o.cta)}</button>
            </div>
            <div class="slide-art" aria-hidden="true">${o.icon}</div>
        </article>`).join('');
    dotsBox.innerHTML = OFFERS.map((_, i) => `<button type="button" class="dot" data-dot="${i}" aria-label="Show offer ${i + 1}"></button>`).join('');

    let idx = 0, timer = null;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function go(i) {
        idx = (i + OFFERS.length) % OFFERS.length;
        track.style.transform = `translateX(-${idx * 100}%)`;
        dotsBox.querySelectorAll('.dot').forEach((d, n) => d.classList.toggle('on', n === idx));
    }
    const stop = () => clearInterval(timer);
    const start = () => { stop(); if (!reduce) timer = setInterval(() => go(idx + 1), 5500); };
    const car = $('#carousel');
    ['mouseenter', 'focusin'].forEach(e => car.addEventListener(e, stop));
    ['mouseleave', 'focusout'].forEach(e => car.addEventListener(e, start));
    $('#car-prev').addEventListener('click', () => go(idx - 1));
    $('#car-next').addEventListener('click', () => go(idx + 1));
    dotsBox.addEventListener('click', (e) => { const d = e.target.closest('[data-dot]'); if (d) go(+d.dataset.dot); });
    go(0); start();

    // Offer details modal (uses the modal from app.js)
    document.addEventListener('click', (e) => {
        const b = e.target.closest('[data-offer]');
        if (!b || typeof openModal !== 'function') return;
        const o = OFFERS[+b.dataset.offer];
        openModal(`
            <h2 style="margin-bottom:12px;">${safe(o.title)}</h2>
            <p style="color:var(--text-muted);margin-bottom:16px;">${safe(o.text)}</p>
            <div class="profile-modal-row"><span>Your code</span><strong>${safe(o.code)}</strong></div>
            <p style="color:var(--text-muted);font-size:0.8rem;margin-top:14px;">Show this code when you book. Terms apply.</p>`);
    });

    // ---------- QUICK ACTIONS ----------
    const actions = isDoctor
        ? [['📋', 'Appointment requests', 'Accept or reject pending visits.', '/doctor-dashboard.html'],
           ['📝', 'Add a patient record', 'Save a diagnosis and prescription.', '/add-record.html'],
           ['🗂️', 'All records', 'Browse every record on file.', '/add-record.html']]
        : [['📅', 'Book an appointment', 'Pick a doctor, date and time.', BOOK],
           ['🧾', 'My records', 'See your visits and medical history.', '/patient-dashboard.html'],
           ['💬', 'Help and support', 'Get in touch with our team.', '#help']];
    $('#action-grid').innerHTML = actions.map(a => `
        <a class="action-card" href="${a[3]}" ${a[3] === '#help' ? 'data-help' : ''}>
            <span class="action-icon" aria-hidden="true">${a[0]}</span>
            <strong>${a[1]}</strong>
            <span>${a[2]}</span>
        </a>`).join('');
    document.addEventListener('click', (e) => {
        if (e.target.closest('[data-help]')) {
            e.preventDefault();
            if (typeof showHelpModal === 'function') showHelpModal();
        }
    });

    // ---------- DOCTORS: search, filter, openings ----------
    if (!isDoctor) {
        const specs = ['All', ...new Set(DOCTORS.map(d => d.spec))];
        let activeSpec = 'All', query = '';

        const chipHtml = (s) => `<button type="button" class="chip${s === activeSpec ? ' on' : ''}" data-spec="${safe(s)}">${safe(s)}</button>`;
        function renderDoctors() {
            const q = query.trim().toLowerCase();
            const list = DOCTORS.filter(d =>
                (activeSpec === 'All' || d.spec === activeSpec) &&
                (!q || d.name.toLowerCase().includes(q) || d.spec.toLowerCase().includes(q)));
            $('#spec-filter').innerHTML = specs.map(chipHtml).join('');
            $('#doctor-count').textContent = `${list.length} available`;
            $('#doctor-grid').innerHTML = list.length ? list.map(d => `
                <article class="doctor-card">
                    <div class="avatar" style="background:linear-gradient(135deg,hsl(${d.hue} 70% 55%),hsl(${d.hue + 40} 70% 45%))" aria-hidden="true">${d.name.split(' ').map(w => w[0]).join('')}</div>
                    <h3>Dr. ${safe(d.name)}</h3>
                    <p class="doc-spec">${safe(d.spec)}</p>
                    <p class="doc-meta">&#9733; ${d.rating} (${d.reviews.toLocaleString()} reviews), ${d.years} years experience</p>
                    <div class="doc-foot">
                        <span class="slot-pill">Next: ${fmt(d.slot)}</span>
                        <a class="btn-mini" href="${BOOK}">Book</a>
                    </div>
                </article>`).join('')
                : `<div class="empty"><p>No doctors match your search.</p><button type="button" class="btn-ghost" id="clear-filters">Show all doctors</button></div>`;
        }
        renderDoctors();

        $('#hero-chips').innerHTML = ['Cardiology', 'Dermatology', 'Pediatrics', 'Psychiatry'].map(s => `<button type="button" class="chip" data-spec="${s}">${s}</button>`).join('');

        document.addEventListener('click', (e) => {
            const c = e.target.closest('[data-spec]');
            if (c) { activeSpec = c.dataset.spec; query = ''; $('#search-input').value = ''; renderDoctors(); if (c.closest('#hero-chips')) $('#doctors').scrollIntoView({ behavior: 'smooth' }); }
            if (e.target.id === 'clear-filters') { activeSpec = 'All'; query = ''; $('#search-input').value = ''; renderDoctors(); }
        });
        $('#search-input').addEventListener('input', (e) => { query = e.target.value; activeSpec = 'All'; renderDoctors(); });
        $('#doctor-search').addEventListener('submit', (e) => { e.preventDefault(); $('#doctors').scrollIntoView({ behavior: 'smooth' }); });

        $('#openings-list').innerHTML = [...DOCTORS].sort((a, b) => a.slot - b.slot).slice(0, 4).map(d => `
            <li><a href="${BOOK}"><span class="open-time">${fmt(d.slot)}</span><span><strong>Dr. ${safe(d.name)}</strong><small>${safe(d.spec)}</small></span></a></li>`).join('');
    }

    // ---------- TRENDING READS ----------
    $('#read-grid').innerHTML = READS.map(r => `
        <article class="read-card">
            <div class="read-cover" style="background:linear-gradient(135deg,hsl(${r.hue} 85% 92%),hsl(${r.hue + 30} 85% 82%))" aria-hidden="true">${r.icon}</div>
            <div class="read-body">
                <span class="read-tag">${safe(r.tag)}</span>
                <h3>${safe(r.title)}</h3>
                <small>${r.min} min read</small>
            </div>
        </article>`).join('');
})();