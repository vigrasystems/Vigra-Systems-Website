// ============================================
// HOMEPAGE SPECIFIC JAVASCRIPT
// ============================================

// ============================================
// LOAD FEATURED PROJECTS FROM FIREBASE
// ============================================
async function loadFeaturedProjects() {
    const projectsContainer = document.getElementById('featuredProjects');
    
    if (!projectsContainer) {
        console.warn('Featured projects container not found');
        return;
    }
    
    if (!window.db) {
        console.error('❌ Firestore not initialized');
        showError(projectsContainer, 'Database not initialized');
        return;
    }
    
    try {
        console.log('📡 Loading featured projects...');
        
        // SIMPLIFIED QUERY - Get all projects, filter and sort in JavaScript
        const querySnapshot = await db.collection('projects').get();
        
        projectsContainer.innerHTML = '';
        
        if (querySnapshot.empty) {
            projectsContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <p style="color: var(--gray-600); font-size: var(--text-lg);">
                        No projects yet. Please populate the database.
                    </p>
                    <a href="populate-database.html" class="btn btn-primary" style="margin-top: 1rem;">Populate Database</a>
                </div>
            `;
            return;
        }
        
        // Filter featured projects and sort by order
        const allProjects = [];
        querySnapshot.forEach(doc => {
            const data = doc.data();
            if (data.featured === true) {
                allProjects.push({ id: doc.id, ...data });
            }
        });
        
        // Sort by order
        allProjects.sort((a, b) => (a.order || 999) - (b.order || 999));
        
        // Take first 3
        const featuredProjects = allProjects.slice(0, 3);
        
        if (featuredProjects.length === 0) {
            projectsContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <p style="color: var(--gray-600); font-size: var(--text-lg);">
                        No featured projects yet.
                    </p>
                </div>
            `;
            return;
        }
        
        // Render projects
        featuredProjects.forEach(project => {
            const projectCard = createProjectCard(project, project.id);
            projectsContainer.appendChild(projectCard);
        });
        
        console.log('✅ Featured projects loaded:', featuredProjects.length);
        
        // Track in Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'featured_projects_loaded', {
                'project_count': featuredProjects.length
            });
        }
        
    } catch (error) {
        console.error('❌ Error loading featured projects:', error);
        
        if (projectsContainer) {
            projectsContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <p style="color: var(--error); font-size: var(--text-lg);">
                        Failed to load projects. Please refresh the page.
                    </p>
                    <button onclick="loadFeaturedProjects()" class="btn btn-primary" style="margin-top: 1rem;">Retry</button>
                </div>
            `;
        }
    }
}

// ============================================
// CREATE PROJECT CARD ELEMENT
// ============================================
function createProjectCard(project, projectId) {
    const card = document.createElement('article');
    card.className = 'project-card fade-in-up';
    
    const imageUrl = project.thumbnailUrl || `https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=${encodeURIComponent(project.title)}`;
    const shortDesc = truncateText(project.shortDescription || project.fullDescription, 120);
    const techTags = (project.technologies || []).slice(0, 3).map(tech => 
        `<span class="tech-tag">${tech}</span>`
    ).join('');
    
    card.innerHTML = `
        <div class="project-image-wrapper" style="overflow: hidden; border-radius: var(--radius-lg) var(--radius-lg) 0 0;">
            <img src="${imageUrl}" alt="${project.title}" class="project-image" loading="lazy">
        </div>
        <div class="project-content">
            <span class="project-category">${project.category || 'Project'}</span>
            <h3 class="project-title">${project.title}</h3>
            <p class="project-description">${shortDesc}</p>
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
    
    card.addEventListener('click', (e) => {
        if (e.target.tagName !== 'A') {
            window.location.href = `project-detail.html?id=${projectId}`;
        }
        
        if (typeof gtag !== 'undefined') {
            gtag('event', 'project_click', {
                'project_id': projectId,
                'project_title': project.title
            });
        }
    });
    
    return card;
}

// ============================================
// HELPER FUNCTION
// ============================================
function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text || '';
    return text.substr(0, maxLength) + '...';
}

function showError(container, message) {
    if (container) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                <p style="color: var(--error);">${message}</p>
            </div>
        `;
    }
}

// ============================================
// INITIALIZE HOMEPAGE
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🏠 Homepage loaded');
    
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase SDK not loaded');
        return;
    }
    
    if (!window.db) {
        console.error('❌ Firestore not initialized');
        return;
    }
    
    // Load featured projects
    loadFeaturedProjects();
    
    // Initialize animations
    setTimeout(() => {
        document.querySelectorAll('.fade-in').forEach(el => {
            el.style.opacity = '1';
        });
    }, 100);
});