// CONFIGURATION
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_KEY';
const SCHOOL_DOMAIN = 'stu.materdei.org'; // Domain restriction enabled
const ADMIN_EMAIL = 'stella.marutyan@gmail.com'; // CHANGE THIS to your email

// Initialize Supabase
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// State
let classes = [];
let activeClassId = null;
let currentUser = null;

// DOM
const loginView = document.getElementById('login-view');
const appContent = document.getElementById('app-content');
const loginBtn = document.getElementById('login-btn');
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

// Auth Logic
const handleLogin = async () => {
    const { error } = await db.auth.signInWithOAuth({
        provider: 'google',
        options: {
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            },
        },
    });
    if (error) alert("Error logging in: " + error.message);
};

const handleLogout = async () => {
    await db.auth.signOut();
    currentUser = null;
    toggleAuthUI();
};

const checkUser = async () => {
    const { data: { session } } = await db.auth.getSession();
    if (session?.user) {
        // Domain Check
        const email = session.user.email;
        if (SCHOOL_DOMAIN && !email.endsWith(SCHOOL_DOMAIN)) {
            alert(`Sorry! This app is only for students at ${SCHOOL_DOMAIN}`);
            await db.auth.signOut();
            return;
        }
        currentUser = session.user;
        fetchData();
    }
    toggleAuthUI();
};

const toggleAuthUI = () => {
    if (currentUser) {
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
    // Fetch classes and their reviews
    const { data, error } = await db
        .from('classes')
        .select(`
            *,
            reviews (*)
        `);

    if (error) {
        console.error("Error fetching data:", error);
        classListEl.innerHTML = `<p style="text-align:center; color:#666;">Failed to load data. Check console.</p>`;
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
    const sortedReviews = [...c.reviews].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

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
loginBtn.addEventListener('click', handleLogin);
logoutBtn.addEventListener('click', handleLogout);

searchInput.addEventListener('input', (e) => renderClassList(e.target.value));

backBtn.addEventListener('click', () => {
    classView.classList.add('hidden');
    homeView.classList.remove('hidden');
    activeClassId = null;
    renderClassList(searchInput.value);
});

// Modal Logic
addReviewBtn.addEventListener('click', () => {
    modalOverlay.classList.remove('hidden');
    rateForm.reset();
});

closeModalBtn.addEventListener('click', () => {
    modalOverlay.classList.add('hidden');
});

modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) modalOverlay.classList.add('hidden');
});

rateForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!activeClassId) return;

    const formData = new FormData(rateForm);
    const newReview = {
        class_id: activeClassId,
        difficulty: parseInt(formData.get('difficulty')),
        homework: parseInt(formData.get('homework')),
        quality: parseInt(formData.get('quality')),
        vibe: formData.get('vibe'),
        grade: "N/A",
        user_email: currentUser.email
    };

    // Optimistic UI Update (optional, but let's just wait for DB for simplicity)
    const { error } = await db.from('reviews').insert([newReview]);

    if (error) {
        alert("Error submitting review: " + error.message);
        return;
    }

    // Refresh Data
    await fetchData();
    openClass(activeClassId); // Re-render profile
    modalOverlay.classList.add('hidden');
});

// Init
checkUser();
// Listen for auth state changes (e.g. after redirect back from Google)
db.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
        checkUser();
    }
});
