import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCJNlX4nS00qIxF0lW5AttjYEPOlcETb-Y",
    authDomain: "smart-collage-project.firebaseapp.com",
    projectId: "smart-collage-project",
    storageBucket: "smart-collage-project.firebasestorage.app",
    messagingSenderId: "157281122997",
    appId: "1:157281122997:web:e7e6654e1d0a0b2fbd5cfc",
    measurementId: "G-HQY0GNNNJG"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    // Tab Switching Logic
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.getAttribute('data-tab');

            // Remove active classes
            navItems.forEach(nav => nav.classList.remove('active'));
            tabContents.forEach(tab => tab.classList.remove('active'));

            // Add active classes
            item.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Theme Toggle Logic
    const themeBtn = document.getElementById('theme-toggle');
    const body = document.body;
    const themeIcon = themeBtn.querySelector('i');

    // Load saved theme
    if (localStorage.getItem('admin-theme') === 'dark') {
        body.setAttribute('data-theme', 'dark');
        themeIcon.classList.replace('fa-moon', 'fa-sun');
    }

    themeBtn.addEventListener('click', () => {
        if (body.getAttribute('data-theme') === 'dark') {
            body.removeAttribute('data-theme');
            themeIcon.classList.replace('fa-sun', 'fa-moon');
            localStorage.setItem('admin-theme', 'light');
        } else {
            body.setAttribute('data-theme', 'dark');
            themeIcon.classList.replace('fa-moon', 'fa-sun');
            localStorage.setItem('admin-theme', 'dark');
        }
        // Update charts on theme change if needed
        updateCharts(body.getAttribute('data-theme') === 'dark');
    });

    // Chart.js - Traffic Chart
    const ctxTraffic = document.getElementById('trafficChart').getContext('2d');
    let trafficChart = new Chart(ctxTraffic, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Chat Sessions',
                data: [450, 620, 850, 780, 1100, 950, 820],
                borderColor: '#4A90E2',
                backgroundColor: 'rgba(74, 144, 226, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: '#4A90E2'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });

    // Chart.js - Category Chart
    const ctxCategory = document.getElementById('categoryChart').getContext('2d');
    let categoryChart = new Chart(ctxCategory, {
        type: 'doughnut',
        data: {
            labels: ['Admissions', 'Courses', 'Scholarships', 'Campus'],
            datasets: [{
                data: [40, 30, 20, 10],
                backgroundColor: ['#4A90E2', '#6C5CE7', '#27AE60', '#F2994A'],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                }
            },
            cutout: '70%'
        }
    });

    function updateCharts(isDark) {
        const textColor = isDark ? '#94A3B8' : '#636E72';
        const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

        [trafficChart, categoryChart].forEach(chart => {
            if (chart.options.scales) {
                if (chart.options.scales.x) chart.options.scales.x.ticks.color = textColor;
                if (chart.options.scales.y) {
                    chart.options.scales.y.ticks.color = textColor;
                    chart.options.scales.y.grid.color = gridColor;
                }
            }
            if (chart.options.plugins.legend.labels) {
                chart.options.plugins.legend.labels.color = textColor;
            }
            chart.update();
        });
    }

    // --- Centralized College Logic ---
    const API_URL = 'http://localhost:3000/api';
    const token = localStorage.getItem('adminToken');

    let colleges = [];
    let activeId = localStorage.getItem('active_college_slug') || 'pu';

    const collegeSelect = document.querySelector('.college-select');
    const collegesGrid = document.getElementById('colleges-grid');
    const addCollegeBtn = document.getElementById('add-college-btn');

    async function loadColleges() {
        try {
            const querySnapshot = await getDocs(collection(db, "colleges"));
            if (!querySnapshot.empty) {
                colleges = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.id) colleges.push(data);
                });
            } else {
                // Fallback / initial setup
                const savedColleges = localStorage.getItem('managed_colleges');
                if (savedColleges) {
                    colleges = JSON.parse(savedColleges);
                } else {
                    colleges = [
                        { id: 1, name: 'Poornima University', slug: 'pu', tagline: 'Shaping Your Future, Inspiring Excellence', brand_color: '#4A90E2' },
                        { id: 2, name: 'Poornima College of Engg.', slug: 'pce', tagline: 'Engineering the Future', brand_color: '#E056FD' }
                    ];
                }
                // Save defaults to Firebase
                for (const c of colleges) {
                    await setDoc(doc(db, "colleges", c.slug), c, { merge: true });
                }
            }

            updateCollegeSelector();
            renderCollegesGrid();
            if (colleges.length > 0 && !colleges.find(c => c.slug === activeId)) {
                activeId = colleges[0].slug;
            }
            loadKnowledge();
            if (typeof loadQuickReplies === 'function') loadQuickReplies();
        } catch (error) {
            console.error('Failed to load colleges from Firebase:', error);
        }
    }

    function updateCollegeSelector() {
        if (!collegeSelect) return;
        collegeSelect.innerHTML = colleges.map(c =>
            `<option value="${c.slug}" ${c.slug === activeId ? 'selected' : ''}>${c.name}</option>`
        ).join('');
    }

    function renderCollegesGrid() {
        if (!collegesGrid) return;
        collegesGrid.innerHTML = colleges.map(c => `
            <div class="stat-card college-card ${c.slug === activeId ? 'active' : ''}">
                <div class="stat-icon" style="background: ${c.brand_color}"><i class="fa-solid fa-hotel"></i></div>
                <div class="stat-data">
                    <h3>${c.name}</h3>
                    <p>${c.tagline}</p>
                    <button class="btn-text" onclick="switchCollege('${c.slug}')">${c.slug === activeId ? 'Active' : 'Manage'}</button>
                </div>
            </div>
        `).join('');
    }

    window.switchCollege = (slug) => {
        activeId = slug;
        localStorage.setItem('active_college_slug', slug);

        const activeCollege = colleges.find(c => c.slug === slug);
        if (activeCollege) {
            localStorage.setItem('pu_branding', JSON.stringify({
                name: activeCollege.name,
                tagline: activeCollege.tagline,
                color: activeCollege.brand_color
            }));
        }

        location.reload();
    };

    if (collegeSelect) {
        collegeSelect.addEventListener('change', (e) => switchCollege(e.target.value));
    }

    if (addCollegeBtn) {
        addCollegeBtn.addEventListener('click', async () => {
            const name = prompt('Enter College Name:');
            if (!name) return;
            const tagline = prompt('Enter Tagline:', 'Welcome to ' + name);
            const slug = name.toLowerCase().replace(/\s/g, '-');
            const newCollege = {
                id: Date.now(),
                name,
                slug,
                tagline,
                brand_color: '#4A90E2'
            };
            colleges.push(newCollege);
            await setDoc(doc(db, "colleges", slug), newCollege, { merge: true });
            
            loadColleges();
            alert('College added to Firebase!');
        });
    }

    // --- Knowledge Base Management ---
    const knowledgeList = document.getElementById('knowledge-list');
    const addKnBtn = document.getElementById('add-kn-btn');
    const saveKnowledgeBtn = document.getElementById('save-knowledge');

    let currentKnowledge = [];

    async function loadKnowledge() {
        if (!activeId) return;
        try {
            const docRef = doc(db, "colleges", activeId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && docSnap.data().knowledge) {
                currentKnowledge = docSnap.data().knowledge;
            } else {
                const savedKnowledge = localStorage.getItem(`kb_${activeId}`);
                if (savedKnowledge) {
                    currentKnowledge = JSON.parse(savedKnowledge);
                } else {
                    currentKnowledge = [
                        { keywords: "location, where", response: "We are located at ISI-2, RIICO Institutional Area, Sitapura, Jaipur, Rajasthan 302022" },
                        { keywords: "fee, cost", response: "The fees structure varies... check out our website." }
                    ];
                }
            }
            renderKnowledge();
        } catch (error) {
            console.error('Failed to load knowledge from Firebase:', error);
        }
    }

    function renderKnowledge() {
        if (!knowledgeList) return;
        knowledgeList.innerHTML = '';
        currentKnowledge.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'knowledge-item';
            div.innerHTML = `
                <div class="know-form-group">
                    <label>Keywords (comma separated)</label>
                    <input type="text" value="${item.keywords}" data-index="${index}" class="know-keywords">
                </div>
                <div class="know-form-group">
                    <label>Bot Response</label>
                    <textarea data-index="${index}" class="know-response">${item.response}</textarea>
                </div>
                <button class="btn-danger" onclick="deleteKnowledge(${index})">Delete</button>
            `;
            knowledgeList.appendChild(div);
        });
    }

    window.deleteKnowledge = (index) => {
        currentKnowledge.splice(index, 1);
        renderKnowledge();
    };

    if (addKnBtn) {
        addKnBtn.addEventListener('click', () => {
            currentKnowledge.push({ keywords: '', response: '' });
            renderKnowledge();
        });
    }

    if (saveKnowledgeBtn) {
        saveKnowledgeBtn.addEventListener('click', async () => {
            const keywords = document.querySelectorAll('.know-keywords');
            const responses = document.querySelectorAll('.know-response');

            const updatedKnowledge = Array.from(keywords).map((k, i) => ({
                keywords: k.value,
                response: responses[i].value
            }));

            await setDoc(doc(db, "colleges", activeId), { knowledge: updatedKnowledge }, { merge: true });
            alert(`Knowledge base updated in Firebase for ${activeId.toUpperCase()}!`);
        });
    }

    // --- Quick Replies Management ---
    const quickRepliesList = document.getElementById('quick-replies-list');
    const addQrBtn = document.getElementById('add-qr-btn');
    const saveQuickRepliesBtn = document.getElementById('save-quick-replies');

    let currentQuickReplies = [];

    window.loadQuickReplies = async function() {
        if (!activeId) return;
        try {
            const docRef = doc(db, "colleges", activeId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && docSnap.data().quickReplies) {
                currentQuickReplies = docSnap.data().quickReplies;
            } else {
                const savedQR = localStorage.getItem(`qr_${activeId}`);
                if (savedQR) {
                    currentQuickReplies = JSON.parse(savedQR);
                } else {
                    currentQuickReplies = [
                        { label: "Campus", text: "Location" },
                        { label: "Programs", text: "Programs" },
                        { label: "Placements", text: "Placements" },
                        { label: "Scholarships", text: "Fees" }
                    ];
                }
            }
            renderQuickReplies();
        } catch (error) {
            console.error('Failed to load quick replies from Firebase:', error);
        }
    }

    function renderQuickReplies() {
        if (!quickRepliesList) return;
        quickRepliesList.innerHTML = '';
        currentQuickReplies.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'knowledge-item';
            div.innerHTML = `
                <div class="know-form-group">
                    <label>Button Label (e.g. Campus)</label>
                    <input type="text" value="${item.label}" class="qr-label">
                </div>
                <div class="know-form-group">
                    <label>Question Sent to Bot (e.g. Location)</label>
                    <input type="text" value="${item.text}" class="qr-text">
                </div>
                <button class="btn-danger" onclick="deleteQuickReply(${index})"><i class="fa-solid fa-trash"></i></button>
            `;
            quickRepliesList.appendChild(div);
        });
    }

    window.deleteQuickReply = (index) => {
        currentQuickReplies.splice(index, 1);
        renderQuickReplies();
    };

    if (addQrBtn) {
        addQrBtn.addEventListener('click', () => {
             if(currentQuickReplies.length >= 6) {
                alert("Maximum 6 quick replies allowed for better UI.");
                return;
             }
            currentQuickReplies.push({ label: '', text: '' });
            renderQuickReplies();
        });
    }

    if (saveQuickRepliesBtn) {
        saveQuickRepliesBtn.addEventListener('click', async () => {
            const labels = document.querySelectorAll('.qr-label');
            const texts = document.querySelectorAll('.qr-text');

            const updatedQR = Array.from(labels).map((l, i) => ({
                label: l.value.trim(),
                text: texts[i].value.trim()
            })).filter(qr => qr.label !== '' && qr.text !== '');

            await setDoc(doc(db, "colleges", activeId), { quickReplies: updatedQR }, { merge: true });
            alert(`Quick replies updated in Firebase for ${activeId.toUpperCase()}!`);
            currentQuickReplies = updatedQR;
            renderQuickReplies();
        });
    }

    loadColleges();

    // Branding Management
    const brandNameInput = document.getElementById('brand-name');
    const brandTaglineInput = document.getElementById('brand-tagline');
    const brandColorInput = document.getElementById('brand-color');
    const networkNameInput = document.getElementById('network-name');
    const saveBrandingBtn = document.getElementById('save-branding');

    if (brandNameInput) {
        // Load existing network name
        const networkName = localStorage.getItem('network_name') || 'Poornima Group';
        if (networkNameInput) networkNameInput.value = networkName;

        // Load existing branding
        const branding = JSON.parse(localStorage.getItem('pu_branding')) || {
            name: 'Poornima University',
            tagline: 'Shaping Your Future, Inspiring Excellence',
            color: '#4A90E2'
        };

        brandNameInput.value = branding.name;
        brandTaglineInput.value = branding.tagline;
        brandColorInput.value = branding.color;
        document.getElementById('color-hex').innerText = branding.color;

        brandColorInput.addEventListener('input', (e) => {
            document.getElementById('color-hex').innerText = e.target.value;
        });

        saveBrandingBtn.addEventListener('click', async () => {
            const newBranding = {
                name: brandNameInput.value,
                tagline: brandTaglineInput.value,
                color: brandColorInput.value
            };

            if (networkNameInput) {
                localStorage.setItem('network_name', networkNameInput.value);
            }

            localStorage.setItem('pu_branding', JSON.stringify(newBranding));

            // Sync the name back to the colleges list too
            const targetIdx = colleges.findIndex(c => c.slug === activeId);
            if (targetIdx !== -1) {
                colleges[targetIdx].name = newBranding.name;
                colleges[targetIdx].brand_color = newBranding.color;
                colleges[targetIdx].tagline = newBranding.tagline;
                
                await setDoc(doc(db, "colleges", activeId), {
                    name: newBranding.name,
                    brand_color: newBranding.color,
                    tagline: newBranding.tagline
                }, { merge: true });
            }

            alert('Network branding updated in Firebase!');
            location.reload();
        });
    }

    // Initial chart refresh
    updateCharts(body.getAttribute('data-theme') === 'dark');

    // Load user profile logic
    const userJson = localStorage.getItem('adminUser');
    if (userJson) {
        try {
            const user = JSON.parse(userJson);
            const userNameEl = document.querySelector('.user-name');
            const userImgEl = document.querySelector('.user-profile img');
            if (userNameEl && user.username) {
                userNameEl.innerText = user.username;
            }
            if (userImgEl) {
                userImgEl.src = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'Admin')}&background=0D8ABC&color=fff`;
            }
        } catch(e) {
            console.error('Error loading user data', e);
        }
    }

    // Logout Functionality
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to log out?')) {
                localStorage.removeItem('adminLoggedIn');
                window.location.href = 'login.html';
            }
        });
    }

    // Simulate search
    const searchInput = document.querySelector('.search-box input');
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            console.log('Searching for:', searchInput.value);
            alert('Search functionality linked to database would go here: ' + searchInput.value);
        }
    });
});
