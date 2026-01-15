// ============================================
// PROJECTS PAGE JAVASCRIPT
// ============================================

let allProjects = [];
let filteredProjects = [];
let currentCategory = 'all';

// ============================================
// LOAD ALL PROJECTS
// ============================================
async function loadProjects() {
    const projectsGrid = document.getElementById('projectsGrid');
    const emptyState = document.getElementById('emptyState');

    try {
        // Query all projects from Firestore
        const querySnapshot = await db.collection('projects')
            .orderBy('order', 'asc')
            .get();

        // Clear loading skeleton
        projectsGrid.innerHTML = '';

        // Check if we have projects
        if (querySnapshot.empty) {
            showEmptyState();
            return;
        }

        // Store all projects
        allProjects = [];
        querySnapshot.forEach(doc => {
            allProjects.push({
                id: doc.id,
                ...doc.data()
            });
        });

        filteredProjects = [...allProjects];

        // Update category counts
        updateCategoryCounts();

        // Render projects
        renderProjects(filteredProjects);

        // Track in Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'projects_loaded', {
                'project_count': allProjects.length
            });
        }

    } catch (error) {
        console.error('Error loading projects:', error);
        showError(projectsGrid, 'Failed to load projects. Please refresh the page.');
    }
}

// ============================================
// RENDER PROJECTS
// ============================================
function renderProjects(projects) {
    const projectsGrid = document.getElementById('projectsGrid');
    const emptyState = document.getElementById('emptyState');

    projectsGrid.innerHTML = '';

    if (projects.length === 0) {
        showEmptyState();
        return;
    }

    emptyState.style.display = 'none';

    projects.forEach(project => {
        const card = createProjectCard(project, project.id);
        projectsGrid.appendChild(card);
    });
}

// ============================================
// CREATE PROJECT CARD
// ============================================
function createProjectCard(project, projectId) {
    const card = document.createElement('article');
    card.className = 'project-card fade-in-up';

    const imageUrl = project.thumbnailUrl || getPlaceholderImage(400, 300, project.title);
    const shortDesc = truncateText(project.shortDescription || project.fullDescription, 120);
    const techTags = (project.technologies || []).slice(0, 3).map(tech =>
        `<span class="tech-tag">${tech}</span>`
    ).join('');

    // Status badge
    const statusBadge = project.status === 'Ongoing'
        ? '<span class="status-badge ongoing">Ongoing</span>'
        : '<span class="status-badge completed">Completed</span>';

    card.innerHTML = `
        <div class="project-image-wrapper" style="overflow: hidden; border-radius: var(--radius-lg) var(--radius-lg) 0 0; position: relative;">
            <img src="${imageUrl}" alt="${project.title}" class="project-image" loading="lazy">
            ${statusBadge}
        </div>
        <div class="project-content">
            <span class="project-category">${project.category || 'Project'}</span>
            <h3 class="project-title">${project.title}</h3>
            <p class="project-description">${shortDesc}</p>
            <div class="project-meta">
                ${project.duration ? `<span class="meta-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${project.duration}</span>` : ''}
                ${project.client ? `<span class="meta-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>${project.client}</span>` : ''}
            </div>
            <div class="project-footer">
                <div class="project-tech">
                    ${techTags}
                </div>
                <a href="project-detail.html?id=${projectId}" class="btn btn-sm btn-outline-primary">
                    View Details
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                        <path d="M7 4l6 6-6 6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </a>
            </div>
        </div>
    `;

    // Add click tracking
    card.addEventListener('click', (e) => {
        if (e.target.tagName !== 'A' && !e.target.closest('a')) {
            window.location.href = `project-detail.html?id=${projectId}`;
        }

        if (typeof gtag !== 'undefined') {
            gtag('event', 'project_click', {
                'project_id': projectId,
                'project_title': project.title,
                'project_category': project.category
            });
        }
    });

    return card;
}

// ============================================
// FILTER BY CATEGORY
// ============================================
function filterByCategory(category) {
    currentCategory = category;

    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === category) {
            btn.classList.add('active');
        }
    });

    // Filter projects
    if (category === 'all') {
        filteredProjects = [...allProjects];
    } else {
        filteredProjects = allProjects.filter(p => p.category === category);
    }

    // Apply search filter if active
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    if (searchTerm) {
        filteredProjects = filteredProjects.filter(p =>
            p.title.toLowerCase().includes(searchTerm) ||
            (p.shortDescription || p.fullDescription).toLowerCase().includes(searchTerm) ||
            (p.technologies || []).some(tech => tech.toLowerCase().includes(searchTerm))
        );
    }

    renderProjects(filteredProjects);

    // Track filter usage
    if (typeof gtag !== 'undefined') {
        gtag('event', 'filter_category', {
            'category': category,
            'result_count': filteredProjects.length
        });
    }
}

// ============================================
// SEARCH PROJECTS
// ============================================
function searchProjects(searchTerm) {
    searchTerm = searchTerm.toLowerCase().trim();

    // Start with category filter
    let results = currentCategory === 'all'
        ? [...allProjects]
        : allProjects.filter(p => p.category === currentCategory);

    // Apply search filter
    if (searchTerm) {
        results = results.filter(p =>
            p.title.toLowerCase().includes(searchTerm) ||
            (p.shortDescription || p.fullDescription).toLowerCase().includes(searchTerm) ||
            (p.technologies || []).some(tech => tech.toLowerCase().includes(searchTerm)) ||
            (p.client || '').toLowerCase().includes(searchTerm)
        );
    }

    filteredProjects = results;
    renderProjects(filteredProjects);

    // Track search
    if (typeof gtag !== 'undefined' && searchTerm) {
        gtag('event', 'search', {
            'search_term': searchTerm,
            'result_count': results.length
        });
    }
}

// ============================================
// UPDATE CATEGORY COUNTS
// ============================================
function updateCategoryCounts() {
    const counts = {
        all: allProjects.length,
        '3d-modelling': 0,
        'design-testing': 0,
        'thermal-analysis': 0,
        '3d-simulation': 0,
        'engineering-documentation': 0
    };

    allProjects.forEach(project => {
        const category = project.category.toLowerCase().replace(/\s+/g, '-');
        if (counts.hasOwnProperty(category)) {
            counts[category]++;
        }
    });

    // Update count displays
    document.getElementById('count-all').textContent = counts.all;
    document.getElementById('count-3d-modelling').textContent = counts['3d-modelling'] || 0;
    document.getElementById('count-design-testing').textContent = counts['design-testing'] || 0;
    document.getElementById('count-thermal-analysis').textContent = counts['thermal-analysis'] || 0;
    document.getElementById('count-3d-simulation').textContent = counts['3d-simulation'] || 0;
    document.getElementById('count-engineering-docs').textContent = counts['engineering-documentation'] || 0;
}

// ============================================
// SHOW EMPTY STATE
// ============================================
function showEmptyState() {
    const projectsGrid = document.getElementById('projectsGrid');
    const emptyState = document.getElementById('emptyState');

    projectsGrid.innerHTML = '';
    emptyState.style.display = 'flex';
}

// ============================================
// CHECK URL PARAMETERS
// ============================================
function checkURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');

    if (category) {
        const categoryMap = {
            '3d-modelling': '3D Modelling',
            'design-testing': 'Design Testing',
            'thermal-analysis': 'Thermal Analysis',
            '3d-simulation': '3D Simulation',
            'engineering-documentation': 'Engineering Documentation'
        };

        const mappedCategory = categoryMap[category.toLowerCase()];
        if (mappedCategory) {
            filterByCategory(mappedCategory);
        }
    }
}

// ============================================
// EVENT LISTENERS
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('📁 Projects page loaded');

    // Load projects
    loadProjects();

    // Check URL parameters
    checkURLParameters();

    // Category filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            filterByCategory(btn.dataset.category);
        });
    });

    // Search input
    const searchInput = document.getElementById('searchInput');
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchProjects(e.target.value);
        }, 300); // Debounce search
    });
});