// CONFIGURATION
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_KEY';

// TRIVIA CONFIGURATION
const TRIVIA_DB = [
    { q: "What year was the school founded?", a: ["1950"] },
    { q: "What is the max number of blocks you can take (enter a number)?", a: ["8", "eight"] },
    { q: "What sport is the most known at our school?", a: ["football", "american football"] }
];

let currentTrivia = null;

// Initialize Supabase
let db = null;
try {
    if (typeof supabase !== 'undefined') {
        const { createClient } = supabase;
        db = createClient(SUPABASE_URL, SUPABASE_KEY);
    } else {
        console.warn("Supabase SDK not loaded (Offline Mode)");
    }
} catch (e) {
    console.warn("Supabase Init Failed (Offline Mode):", e);
}

// State
let classes = [];
let activeClassId = null;
let isAuthenticated = false;

// DOM
const loginView = document.getElementById('login-view');
const appContent = document.getElementById('app-content');
const triviaInput = document.getElementById('trivia-input');
// Use robust selector
const triviaQuestionEl = document.querySelector('.challenge-q');
const triviaError = document.getElementById('trivia-error');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');

const homeView = document.getElementById('home-view');
const classView = document.getElementById('class-view');
const classListEl = document.getElementById('class-list');
const searchInput = document.getElementById('search-input');
const backBtn = document.getElementById('back-btn');

// Profile DOM
const classHeader = document.getElementById('class-header');
const reviewsList = document.getElementById('reviews-list');
const barDiff = document.getElementById('bar-difficulty');
const valDiff = document.getElementById('val-difficulty');
const barHW = document.getElementById('bar-homework');
const valHW = document.getElementById('val-homework');
const barQual = document.getElementById('bar-quality');
const valQual = document.getElementById('val-quality');

// Modal DOM
const modalOverlay = document.getElementById('modal-overlay');
const addReviewBtn = document.getElementById('add-review-btn');
const closeModalBtn = document.getElementById('close-modal');
const rateForm = document.getElementById('rate-form');

// Auth Logic (Trivia Mode)
const checkAuth = () => {
    const hasPassed = localStorage.getItem('vibe_check_passed');
    if (hasPassed === 'true') {
        isAuthenticated = true;
        if (db) fetchData();
        else console.warn("Authenticated but no DB connection.");
    } else {
        initTrivia();
    }
    toggleAuthUI();
};

const initTrivia = () => {
    if (!triviaQuestionEl) return;
    const randomIndex = Math.floor(Math.random() * TRIVIA_DB.length);
    currentTrivia = TRIVIA_DB[randomIndex];
    triviaQuestionEl.textContent = `Question: ${currentTrivia.q}`;
    console.log("Answer:", currentTrivia.a[0]);
};

const handleLogin = (e) => {
    e.preventDefault();
    const answer = triviaInput.value.trim().toLowerCase();

    if (currentTrivia && currentTrivia.a.includes(answer)) {
        localStorage.setItem('vibe_check_passed', 'true');
        isAuthenticated = true;
        if (db) fetchData();
        toggleAuthUI();
        triviaInput.value = '';
        triviaError.classList.add('hidden');
    } else {
        triviaError.classList.remove('hidden');
        triviaInput.classList.add('shake');
        setTimeout(() => triviaInput.classList.remove('shake'), 500);
    }
};

const handleLogout = () => {
    localStorage.removeItem('vibe_check_passed');
    isAuthenticated = false;
    toggleAuthUI();
    initTrivia();
};

const toggleAuthUI = () => {
    if (isAuthenticated) {
        loginView.classList.add('hidden');
        appContent.classList.remove('hidden');
    } else {
        loginView.classList.remove('hidden');
        appContent.classList.add('hidden');
    }
};

// Utils
const getAvg = (reviews, key) => {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r[key], 0);
    return (sum / reviews.length).toFixed(1);
};

// Fetch Data
const fetchData = async () => {
    if (!db) {
        // Fallback or show error
        // If Supabase isn't setup yet, showing mock data helps testing
        if (SUPABASE_URL.includes('YOUR_SUPABASE')) {
            console.warn("Using MOCK DATA because Supabase is not configured.");
            classes = [
                { id: '1', name: 'AP U.S. History', teacher: 'Mr. Anderson', reviews: [{ quality: 5, difficulty: 5, homework: 5, vibe: 'Great class' }] },
                { id: '2', name: 'AP Physics', teacher: 'Ms. Frizzle', reviews: [] }
            ];
            renderClassList(searchInput.value);
            return;
        }
        return;
    };

    // Fetch classes and their reviews
    const { data, error } = await db
        .from('classes')
        .select(`
            *,
            reviews (*)
        `);

    if (error) {
        console.error("Error fetching data:", error);
        return;
    }

    classes = data;
    renderClassList(searchInput.value);
};

// Render Home
const renderClassList = (filterText = '') => {
    classListEl.innerHTML = '';

    classes.filter(c => {
        const query = filterText.toLowerCase();
        return c.name.toLowerCase().includes(query) || c.teacher.toLowerCase().includes(query);
    }).forEach(c => {
        const diff = getAvg(c.reviews, 'difficulty');
        const qual = getAvg(c.reviews, 'quality');

        let tags = '';
        if (diff >= 4.5) tags += `<span class="badge killer">💀 GPA Killer</span>`;
        if (diff <= 2.0 && qual >= 4.0) tags += `<span class="badge chill">✨ Easy A</span>`;
        tags += `<span class="badge score">★ ${qual}/5</span>`;

        const card = document.createElement('div');
        card.className = 'class-card';
        card.innerHTML = `
            <h3>${c.name}</h3>
            <div class="teacher-name">${c.teacher}</div>
            <div class="badges">${tags}</div>
        `;
        card.onclick = () => openClass(c.id);
        classListEl.appendChild(card);
    });
};

// Render Class Profile
const openClass = (id) => {
    activeClassId = id;
    const c = classes.find(i => i.id === id);
    if (!c) return;

    // Header
    classHeader.innerHTML = `
        <h2>${c.name}</h2>
        <div class="teacher-name">${c.teacher}</div>
    `;

    // Stats
    const diff = getAvg(c.reviews, 'difficulty');
    const hw = getAvg(c.reviews, 'homework');
    const qual = getAvg(c.reviews, 'quality');

    updateBar(barDiff, valDiff, diff);
    updateBar(barHW, valHW, hw);
    updateBar(barQual, valQual, qual);

    // Reviews
    reviewsList.innerHTML = '';
    // Sort reviews new to old
    const sortedReviews = c.reviews ? [...c.reviews].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) : [];

    if (sortedReviews.length === 0) {
        reviewsList.innerHTML = `<p style="text-align:center; color:#666; font-style:italic;">No reviews yet. Be the first!</p>`;
    }

    sortedReviews.forEach(r => {
        const div = document.createElement('div');
        div.className = 'review-card';
        div.innerHTML = `
            <div class="review-header">
                <span class="review-grade">Grade: ?</span>
                <span class="badge score" style="font-size:0.7em">Qual: ${r.quality}/5</span>
            </div>
            <div class="review-text">"${r.vibe}"</div>
        `;
        reviewsList.appendChild(div);
    });

    // Switch View
    homeView.classList.add('hidden');
    classView.classList.remove('hidden');
    window.scrollTo(0, 0);
};

const updateBar = (bar, val, score) => {
    const pct = (score / 5) * 100;
    bar.style.width = `${pct}%`;
    val.textContent = score;

    // Color logic
    if (score >= 4) bar.style.backgroundColor = getComputedStyle(document.body).getPropertyValue('--secondary');
    else bar.style.backgroundColor = getComputedStyle(document.body).getPropertyValue('--primary');
};

// Event Listeners
if (loginForm) loginForm.addEventListener('submit', handleLogin);
if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

if (searchInput) searchInput.addEventListener('input', (e) => renderClassList(e.target.value));

if (backBtn) backBtn.addEventListener('click', () => {
    classView.classList.add('hidden');
    homeView.classList.remove('hidden');
    activeClassId = null;
    renderClassList(searchInput.value);
});

// Modal Logic
if (addReviewBtn) addReviewBtn.addEventListener('click', () => {
    modalOverlay.classList.remove('hidden');
    rateForm.reset();
});

if (closeModalBtn) closeModalBtn.addEventListener('click', () => {
    modalOverlay.classList.add('hidden');
});

if (modalOverlay) modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) modalOverlay.classList.add('hidden');
});

if (rateForm) rateForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!activeClassId) return;

    const formData = new FormData(rateForm);
    const newReview = {
        class_id: activeClassId,
        difficulty: parseInt(formData.get('difficulty')),
        homework: parseInt(formData.get('homework')),
        quality: parseInt(formData.get('quality')),
        vibe: formData.get('vibe'),
        grade: "N/A"
    };

    // Optimistic UI Update
    if (db) {
        const { error } = await db.from('reviews').insert([newReview]);
        if (error) {
            alert("Error submitting review: " + error.message);
            return;
        }
        await fetchData();
    } else {
        alert("Success! (Offline Mode - Review not saved permanently)");
    }

    openClass(activeClassId); // Re-render profile
    modalOverlay.classList.add('hidden');
});

// Init
console.log("Script loaded, starting init...");
checkAuth();
