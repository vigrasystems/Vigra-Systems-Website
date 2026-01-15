// ============================================
// PROJECT DETAIL PAGE JAVASCRIPT
// ============================================

let currentProjectId = null;
let currentProject = null;

// ============================================
// GET PROJECT ID FROM URL
// ============================================
function getProjectIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// ============================================
// LOAD PROJECT DETAILS
// ============================================
async function loadProjectDetail() {
    const projectId = getProjectIdFromURL();

    if (!projectId) {
        showError('Project not found');
        return;
    }

    currentProjectId = projectId;

    try {
        const docRef = db.collection('projects').doc(projectId);
        const doc = await docRef.get();

        if (!doc.exists) {
            showError('Project not found');
            return;
        }

        currentProject = { id: doc.id, ...doc.data() };
        renderProjectDetail(currentProject);
        loadRelatedProjects(currentProject.category);

        // Update page title and meta
        document.title = `${currentProject.title} | Vigra-Systems`;

        // Track page view
        if (typeof gtag !== 'undefined') {
            gtag('event', 'project_view', {
                'project_id': projectId,
                'project_title': currentProject.title,
                'project_category': currentProject.category
            });
        }

    } catch (error) {
        console.error('Error loading project:', error);
        showError('Failed to load project details');
    }
}

// ============================================
// RENDER PROJECT DETAIL
// ============================================
function renderProjectDetail(project) {
    const container = document.getElementById('projectDetail');
    const loading = container.querySelector('.project-detail-loading');

    const imageUrl = project.thumbnailUrl || getPlaceholderImage(1200, 600, project.title);
    const completedDate = project.completedDate ? formatDate(project.completedDate) : 'Ongoing';

    // Create image gallery
    const imageGallery = project.imageGallery && project.imageGallery.length > 0
        ? `<div class="project-gallery">
            ${project.imageGallery.map(url => `
                <img src="${url}" alt="${project.title}" loading="lazy" onclick="openImageModal('${url}')">
            `).join('')}
           </div>`
        : '';

    const techTags = (project.technologies || []).map(tech =>
        `<span class="tech-tag">${tech}</span>`
    ).join('');

    const content = `
        <div class="project-hero">
            <div class="container" style="max-width: 1200px;">
                <div class="project-hero-content">
                    <div class="breadcrumb">
                        <a href="index.html">Home</a>
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                            <path d="M7 4l6 6-6 6" stroke-width="2"/>
                        </svg>
                        <a href="projects.html">Projects</a>
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                            <path d="M7 4l6 6-6 6" stroke-width="2"/>
                        </svg>
                        <span>${project.title}</span>
                    </div>
                    <h1 class="project-detail-title">${project.title}</h1>
                    <div class="project-meta-tags">
                        <span class="meta-tag">${project.category}</span>
                        <span class="meta-tag ${project.status === 'Completed' ? 'completed' : 'ongoing'}">${project.status}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="project-featured-image">
            <img src="${imageUrl}" alt="${project.title}">
        </div>
        
        <div class="container" style="max-width: 900px;">
            <div class="project-info-grid">
                ${project.client ? `
                <div class="info-item">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <div>
                        <h4>Client</h4>
                        <p>${project.client}</p>
                    </div>
                </div>
                ` : ''}
                
                ${project.duration ? `
                <div class="info-item">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <div>
                        <h4>Duration</h4>
                        <p>${project.duration}</p>
                    </div>
                </div>
                ` : ''}
                
                <div class="info-item">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <div>
                        <h4>Completed</h4>
                        <p>${completedDate}</p>
                    </div>
                </div>
                
                ${project.technologies && project.technologies.length > 0 ? `
                <div class="info-item full-width">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="16 18 22 12 16 6"/>
                        <polyline points="8 6 2 12 8 18"/>
                    </svg>
                    <div>
                        <h4>Technologies Used</h4>
                        <div class="tech-tags-wrapper">
                            ${techTags}
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>
            
            <div class="project-description-section">
                <h2>Project Overview</h2>
                <div class="project-description-content">
                    ${formatDescription(project.fullDescription)}
                </div>
            </div>
            
            ${imageGallery}
            
            <div class="project-cta">
                <h3>Interested in a Similar Project?</h3>
                <p>Get in touch with us to discuss your R&D needs.</p>
                <div class="cta-buttons">
                    <a href="quote.html" class="btn btn-primary">Request a Quote</a>
                    <a href="contact.html" class="btn btn-secondary">Contact Us</a>
                </div>
            </div>
        </div>
    `;

    loading.style.display = 'none';
    container.innerHTML = content;
}

// ============================================
// FORMAT DESCRIPTION (Convert line breaks to paragraphs)
// ============================================
function formatDescription(description) {
    if (!description) return '';

    return description
        .split('\n\n')
        .map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`)
        .join('');
}

// ============================================
// LOAD RELATED PROJECTS
// ============================================
async function loadRelatedProjects(category) {
    const relatedSection = document.getElementById('relatedProjects');
    const relatedGrid = document.getElementById('relatedGrid');

    if (!category) return;

    try {
        const querySnapshot = await db.collection('projects')
            .where('category', '==', category)
            .where('status', '==', 'Completed')
            .limit(4)
            .get();

        if (querySnapshot.empty) {
            return;
        }

        relatedGrid.innerHTML = '';
        let count = 0;

        querySnapshot.forEach(doc => {
            // Skip current project
            if (doc.id === currentProjectId) return;
            if (count >= 3) return; // Max 3 related projects

            const project = doc.data();
            const card = createProjectCard(project, doc.id);
            relatedGrid.appendChild(card);
            count++;
        });

        if (count > 0) {
            relatedSection.style.display = 'block';
        }

    } catch (error) {
        console.error('Error loading related projects:', error);
    }
}

// ============================================
// SHOW ERROR
// ============================================
function showError(message) {
    const container = document.getElementById('projectDetail');
    container.innerHTML = `
        <div class="container" style="text-align: center; padding: 4rem 0;">
            <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <h2 style="margin-top: 2rem;">${message}</h2>
            <p style="color: var(--gray-600); margin-bottom: 2rem;">The project you're looking for doesn't exist or has been removed.</p>
            <a href="projects.html" class="btn btn-primary">View All Projects</a>
        </div>
    `;
}

// ============================================
// OPEN IMAGE MODAL (Optional - Simple lightbox)
// ============================================
function openImageModal(imageUrl) {
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
        <div class="modal-backdrop" onclick="this.parentElement.remove()"></div>
        <div class="modal-content">
            <button class="modal-close" onclick="this.closest('.image-modal').remove()">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
            <img src="${imageUrl}" alt="Project image">
        </div>
    `;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.remove();
        document.body.style.overflow = '';
    });
}

// ============================================
// INITIALIZE
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 Project detail page loaded');
    loadProjectDetail();
});