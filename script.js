// CONFIGURATION
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_KEY';



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

// DOM
// DOM
const appContent = document.getElementById('app-content');

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
// Modal DOM
const modalOverlay = document.getElementById('modal-overlay');
const addReviewBtn = document.getElementById('add-review-btn');
const closeModalBtn = document.getElementById('close-modal');
const rateForm = document.getElementById('rate-form');
const modalTitle = document.getElementById('modal-title');
// Add Class DOM Removed

// Auth Logic (Trivia Mode)


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
            console.warn("Using HARDCODED DATA.");
            classes = [
                { id: '1', teacher: 'Mrs. Kate Aceves', name: 'English Teacher', reviews: [] },
                { id: '2', teacher: 'Ms. Nataly Alvarado', name: 'Social Worker', reviews: [] },
                { id: '3', teacher: 'Mr. Kevin Anderson', name: 'Head Athletic Trainer', reviews: [] },
                { id: '4', teacher: 'Ms. Sarai Avila', name: 'English Teacher', reviews: [] },
                { id: '5', teacher: 'Mr. Brian Barsuglia', name: 'English Teacher', reviews: [] },
                { id: '6', teacher: 'Mrs. Jennifer Battaglia', name: 'World Languages', reviews: [] },
                { id: '7', teacher: 'Mrs. Patricia Berrelleza', name: 'World Languages', reviews: [] },
                { id: '8', teacher: 'Ms. Kathryn Bystedt \'01', name: 'Religious Studies', reviews: [] },
                { id: '9', teacher: 'Mr. Kenneth Connolly', name: 'Film and Media Arts', reviews: [] },
                { id: '10', teacher: 'Ms. Taylor Cooper', name: 'Math Teacher', reviews: [] },
                { id: '11', teacher: 'Mr. Vincent Dao', name: 'Religious Studies', reviews: [] },
                { id: '12', teacher: 'Ms. Caroline Davies', name: 'Visual Arts Teacher', reviews: [] },
                { id: '13', teacher: 'Mr. Ben De Los Reyes', name: 'Religious Studies', reviews: [] },
                { id: '14', teacher: 'Mr. Justin Deskovick \'08', name: 'Social Studies', reviews: [] },
                { id: '15', teacher: 'Mr. Ken Dory', name: 'Learning Center', reviews: [] },
                { id: '16', teacher: 'Ms. Aracely Elizondo', name: 'World Languages', reviews: [] },
                { id: '17', teacher: 'Ms. Agnes Faltas', name: 'Science Teacher', reviews: [] },
                { id: '18', teacher: 'Mrs. Andrea Fouts', name: 'Musical Theatre', reviews: [] },
                { id: '19', teacher: 'Mr. Sean Ganey', name: 'Math Teacher', reviews: [] },
                { id: '20', teacher: 'Mr. Joseph Garcia', name: 'Science Teacher', reviews: [] },
                { id: '21', teacher: 'Mrs. Sonia Garcia', name: 'World Languages', reviews: [] },
                { id: '22', teacher: 'Ms. Anna-Lisa George \'89', name: 'English Teacher', reviews: [] },
                { id: '23', teacher: 'Mrs. Kali Gomez \'01', name: 'Science Dept Chair', reviews: [] },
                { id: '24', teacher: 'Mr. William Griffith', name: 'Math Teacher', reviews: [] },
                { id: '25', teacher: 'Mrs. Maria Gutierrez-Barnett', name: 'Social Studies', reviews: [] },
                { id: '26', teacher: 'Ms. Gina Hanson', name: 'Math Teacher', reviews: [] },
                { id: '27', teacher: 'Ms. Nicole Howard \'85', name: 'Journalism', reviews: [] },
                { id: '28', teacher: 'Mrs. Denise Johnson \'83', name: 'English Teacher', reviews: [] },
                { id: '29', teacher: 'Dr. Erin Kelly', name: 'English Teacher', reviews: [] },
                { id: '30', teacher: 'Mrs. Eunice Kim', name: 'English Dept Chair', reviews: [] },
                { id: '31', teacher: 'Mrs. Charisse Kitsinis', name: 'Social Studies', reviews: [] },
                { id: '32', teacher: 'Mr. Jonathan Knauer \'10', name: 'Choir Teacher', reviews: [] },
                { id: '33', teacher: 'Mr. Andrew Kubasek', name: 'English Teacher', reviews: [] },
                { id: '34', teacher: 'Mrs. Madison Leal', name: 'Theatre Arts', reviews: [] },
                { id: '35', teacher: 'Mr. Sean Lieblang', name: 'Math Teacher', reviews: [] },
                { id: '36', teacher: 'Mr. Joshua Long', name: 'English Teacher', reviews: [] },
                { id: '37', teacher: 'Ms. Zeyda Marsh', name: 'World Languages', reviews: [] },
                { id: '38', teacher: 'Mr. Fernando Martinez', name: 'Instrumental Music', reviews: [] },
                { id: '39', teacher: 'Mr. Rick Martinez \'83', name: 'Science Teacher', reviews: [] },
                { id: '40', teacher: 'Mr. Mark Mulholland', name: 'Social Studies', reviews: [] },
                { id: '41', teacher: 'Mr. Daniel Munguia', name: 'World Languages', reviews: [] },
                { id: '42', teacher: 'Mr. Dan O\'Dell', name: 'Math Teacher', reviews: [] },
                { id: '43', teacher: 'Ms. Jessica Pan', name: 'Visual Arts Teacher', reviews: [] },
                { id: '44', teacher: 'Mr. Kelly Petro', name: 'Science Teacher', reviews: [] },
                { id: '45', teacher: 'Mr. Christopher Pham', name: 'World Languages', reviews: [] },
                { id: '46', teacher: 'Mr. Jack Phan', name: 'Science Teacher', reviews: [] },
                { id: '47', teacher: 'Ms. Stephanie Phillips', name: 'English Teacher', reviews: [] },
                { id: '48', teacher: 'Mr. James Rebudal', name: 'Religious Studies', reviews: [] },
                { id: '49', teacher: 'Mr. Andrew Roberts', name: 'Film and Media Arts', reviews: [] },
                { id: '50', teacher: 'Mr. Kyle Roberts', name: 'Visual Arts', reviews: [] },
                { id: '51', teacher: 'Mrs. Elizabeth Rosales', name: 'Religious Studies', reviews: [] },
                { id: '52', teacher: 'Ms. Sarah Serna', name: 'Social Studies', reviews: [] },
                { id: '53', teacher: 'Mrs. Susana Siffredi', name: 'World Languages', reviews: [] },
                { id: '54', teacher: 'Ms. Sarah Smith \'97', name: 'Science Teacher', reviews: [] },
                { id: '55', teacher: 'Mrs. Melissa Sordan', name: 'English Teacher', reviews: [] },
                { id: '56', teacher: 'Ms. Dorinda Upham', name: 'Religious Studies', reviews: [] },
                { id: '57', teacher: 'Ms. Marla Utley', name: 'Science Teacher', reviews: [] },
                { id: '58', teacher: 'Ms. Nora Valle', name: 'Social Studies', reviews: [] },
                { id: '59', teacher: 'Mr. Ben Van Dyk', name: 'Social Studies', reviews: [] },
                { id: '60', teacher: 'Mr. Anthony Vasquez \'85', name: 'Math Teacher', reviews: [] },
                { id: '61', teacher: 'Mr. Matty West', name: 'Social Studies', reviews: [] },
                { id: '62', teacher: 'Ms. Shannon Zimmerman', name: 'Dance & Yoga', reviews: [] }
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
        return c.teacher.toLowerCase().includes(query) || c.name.toLowerCase().includes(query);
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
            <h3>${c.teacher}</h3>
            <div class="teacher-name">${c.name}</div>
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
        <h2>${c.teacher}</h2>
        <div class="teacher-name">${c.name}</div>
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

if (searchInput) searchInput.addEventListener('input', (e) => renderClassList(e.target.value));

if (backBtn) backBtn.addEventListener('click', () => {
    classView.classList.add('hidden');
    homeView.classList.remove('hidden');
    activeClassId = null;
    renderClassList(searchInput.value);
});

// Modal DOM (Consolidated above)

// ... [Keep other code] ...

// Modal Logic
if (addReviewBtn) addReviewBtn.addEventListener('click', () => {
    openModal('rate');
});



if (closeModalBtn) closeModalBtn.addEventListener('click', () => {
    modalOverlay.classList.add('hidden');
});

if (modalOverlay) modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) modalOverlay.classList.add('hidden');
});

const openModal = (type) => {
    modalOverlay.classList.remove('hidden');
    if (type === 'rate') {
        modalTitle.textContent = "Rate this Teacher";
        rateForm.classList.remove('hidden');
        rateForm.reset();
    }
};

// Add Class Logic Removed

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
// Init
console.log("Script loaded, starting init...");
if (db) fetchData();
else {
    // Attempt offline fetch if db isn't immediately ready or for mock mode logic
    fetchData();
}
