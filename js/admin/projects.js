// ============================================
// ADMIN PROJECTS MANAGEMENT
// ============================================

let allProjects = [];
let currentEditId = null;
let deleteProjectId = null;
let thumbnailFile = null;
let galleryFiles = [];

// ============================================
// LOAD ALL PROJECTS
// ============================================
async function loadProjects() {
    const tableBody = document.querySelector('#projectsTable tbody');
    
    try {
        const querySnapshot = await db.collection('projects')
            .orderBy('order', 'asc')
            .get();
        
        tableBody.innerHTML = '';
        allProjects = [];
        
        if (querySnapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="8" class="empty-cell">No projects yet. Click "Add Project" to get started.</td></tr>';
            return;
        }
        
        querySnapshot.forEach(doc => {
            const project = { id: doc.id, ...doc.data() };
            allProjects.push(project);
            
            const row = createProjectRow(project);
            tableBody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading projects:', error);
        tableBody.innerHTML = '<tr><td colspan="8" class="error-cell">Failed to load projects</td></tr>';
    }
}

// ============================================
// CREATE PROJECT ROW
// ============================================
function createProjectRow(project) {
    const row = document.createElement('tr');
    
    const thumbnail = project.thumbnailUrl 
        ? `<img src="${project.thumbnailUrl}" alt="${project.title}" class="table-thumbnail">` 
        : '<div class="table-thumbnail-placeholder">No image</div>';
    
    const featuredBadge = project.featured 
        ? '<span class="badge badge-success">Yes</span>' 
        : '<span class="badge badge-secondary">No</span>';
    
    const statusClass = project.status === 'Completed' ? 'status-completed' : 'status-ongoing';
    
    row.innerHTML = `
        <td>${thumbnail}</td>
        <td><strong>${project.title}</strong></td>
        <td><span class="badge badge-primary">${project.category}</span></td>
        <td><span class="status-badge ${statusClass}">${project.status}</span></td>
        <td>${project.client || 'N/A'}</td>
        <td>${featuredBadge}</td>
        <td>${project.order}</td>
        <td>
            <div class="action-buttons">
                <button class="btn-icon btn-icon-primary" onclick="editProject('${project.id}')" title="Edit">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                </button>
                <button class="btn-icon btn-icon-danger" onclick="deleteProject('${project.id}')" title="Delete">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                </button>
            </div>
        </td>
    `;
    
    return row;
}

// ============================================
// OPEN PROJECT MODAL
// ============================================
function openProjectModal(projectId = null) {
    const modal = document.getElementById('projectModal');
    const form = document.getElementById('projectForm');
    const modalTitle = document.getElementById('modalTitle');
    
    // Reset form
    form.reset();
    currentEditId = projectId;
    thumbnailFile = null;
    galleryFiles = [];
    document.getElementById('thumbnailPreview').innerHTML = '';
    document.getElementById('galleryPreview').innerHTML = '';
    
    if (projectId) {
        // Edit mode
        modalTitle.textContent = 'Edit Project';
        const project = allProjects.find(p => p.id === projectId);
        
        if (project) {
            document.getElementById('projectId').value = project.id;
            document.getElementById('projectTitle').value = project.title;
            document.getElementById('projectCategory').value = project.category;
            document.getElementById('projectShortDesc').value = project.shortDescription || '';
            document.getElementById('projectFullDesc').value = project.fullDescription || '';
            document.getElementById('projectClient').value = project.client || '';
            document.getElementById('projectDuration').value = project.duration || '';
            document.getElementById('projectStatus').value = project.status;
            document.getElementById('projectOrder').value = project.order;
            document.getElementById('projectTechnologies').value = (project.technologies || []).join(', ');
            document.getElementById('projectFeatured').checked = project.featured || false;
            
            // Show existing thumbnail
            if (project.thumbnailUrl) {
                document.getElementById('thumbnailPreview').innerHTML = `
                    <img src="${project.thumbnailUrl}" alt="Current thumbnail">
                    <p class="text-sm text-muted">Current image (upload new to replace)</p>
                `;
            }
            
            // Show existing gallery
            if (project.imageGallery && project.imageGallery.length > 0) {
                const galleryHTML = project.imageGallery.map(url => 
                    `<img src="${url}" alt="Gallery image">`
                ).join('');
                document.getElementById('galleryPreview').innerHTML = galleryHTML + 
                    '<p class="text-sm text-muted">Current images (upload new to replace)</p>';
            }
        }
    } else {
        // Add mode
        modalTitle.textContent = 'Add New Project';
        document.getElementById('projectId').value = '';
    }
    
    modal.classList.add('active');
}

window.openProjectModal = openProjectModal;

// ============================================
// CLOSE PROJECT MODAL
// ============================================
function closeProjectModal() {
    document.getElementById('projectModal').classList.remove('active');
}

window.closeProjectModal = closeProjectModal;

// ============================================
// HANDLE FILE UPLOADS
// ============================================
document.getElementById('projectThumbnail')?.addEventListener('change', (e) => {
    thumbnailFile = e.target.files[0];
    const preview = document.getElementById('thumbnailPreview');
    
    if (thumbnailFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(thumbnailFile);
    }
});

document.getElementById('projectGallery')?.addEventListener('change', (e) => {
    galleryFiles = Array.from(e.target.files);
    const preview = document.getElementById('galleryPreview');
    preview.innerHTML = '';
    
    galleryFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            preview.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
});

// ============================================
// SAVE PROJECT
// ============================================
document.getElementById('projectForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const saveBtn = document.getElementById('saveProjectBtn');
    const btnText = saveBtn.querySelector('.btn-text');
    const btnLoading = saveBtn.querySelector('.btn-loading');
    
    // Show loading
    saveBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    
    try {
        // Upload images if new
        let thumbnailUrl = null;
        let galleryUrls = [];
        
        if (thumbnailFile) {
            const storageRef = storage.ref(`projects/${Date.now()}_${thumbnailFile.name}`);
            const snapshot = await storageRef.put(thumbnailFile);
            thumbnailUrl = await snapshot.ref.getDownloadURL();
        } else if (currentEditId) {
            // Keep existing thumbnail
            const existingProject = allProjects.find(p => p.id === currentEditId);
            thumbnailUrl = existingProject?.thumbnailUrl;
        }
        
        if (galleryFiles.length > 0) {
            const uploadPromises = galleryFiles.map(async (file) => {
                const storageRef = storage.ref(`projects/gallery/${Date.now()}_${file.name}`);
                const snapshot = await storageRef.put(file);
                return await snapshot.ref.getDownloadURL();
            });
            galleryUrls = await Promise.all(uploadPromises);
        } else if (currentEditId) {
            // Keep existing gallery
            const existingProject = allProjects.find(p => p.id === currentEditId);
            galleryUrls = existingProject?.imageGallery || [];
        }
        
        // Prepare project data
        const technologies = document.getElementById('projectTechnologies').value
            .split(',')
            .map(t => t.trim())
            .filter(t => t);
        
        const projectData = {
            title: document.getElementById('projectTitle').value.trim(),
            category: document.getElementById('projectCategory').value,
            shortDescription: document.getElementById('projectShortDesc').value.trim(),
            fullDescription: document.getElementById('projectFullDesc').value.trim(),
            client: document.getElementById('projectClient').value.trim() || null,
            duration: document.getElementById('projectDuration').value.trim() || null,
            status: document.getElementById('projectStatus').value,
            order: parseInt(document.getElementById('projectOrder').value),
            technologies: technologies,
            featured: document.getElementById('projectFeatured').checked,
            thumbnailUrl: thumbnailUrl,
            imageGallery: galleryUrls,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (currentEditId) {
            // Update existing
            await db.collection('projects').doc(currentEditId).update(projectData);
        } else {
            // Create new
            projectData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            projectData.completedDate = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('projects').add(projectData);
        }
        
        // Reload projects
        await loadProjects();
        closeProjectModal();
        
        // Show success message
        showNotification('Project saved successfully!', 'success');
        
    } catch (error) {
        console.error('Error saving project:', error);
        showNotification('Failed to save project. Please try again.', 'error');
    } finally {
        saveBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
});

// ============================================
// EDIT PROJECT
// ============================================
function editProject(projectId) {
    openProjectModal(projectId);
}

window.editProject = editProject;

// ============================================
// DELETE PROJECT
// ============================================
function deleteProject(projectId) {
    deleteProjectId = projectId;
    document.getElementById('deleteModal').classList.add('active');
}

window.deleteProject = deleteProject;

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('active');
    deleteProjectId = null;
}

window.closeDeleteModal = closeDeleteModal;

async function confirmDelete() {
    if (!deleteProjectId) return;
    
    try {
        await db.collection('projects').doc(deleteProjectId).delete();
        await loadProjects();
        closeDeleteModal();
        showNotification('Project deleted successfully!', 'success');
    } catch (error) {
        console.error('Error deleting project:', error);
        showNotification('Failed to delete project.', 'error');
    }
}

window.confirmDelete = confirmDelete;

// ============================================
// SEARCH AND FILTER
// ============================================
document.getElementById('searchProjects')?.addEventListener('input', filterProjects);
document.getElementById('filterCategory')?.addEventListener('change', filterProjects);
document.getElementById('filterStatus')?.addEventListener('change', filterProjects);

function filterProjects() {
    const searchTerm = document.getElementById('searchProjects').value.toLowerCase();
    const category = document.getElementById('filterCategory').value;
    const status = document.getElementById('filterStatus').value;
    
    const tableBody = document.querySelector('#projectsTable tbody');
    tableBody.innerHTML = '';
    
    const filtered = allProjects.filter(project => {
        const matchesSearch = !searchTerm || 
            project.title.toLowerCase().includes(searchTerm) ||
            (project.client || '').toLowerCase().includes(searchTerm);
        
        const matchesCategory = !category || project.category === category;
        const matchesStatus = !status || project.status === status;
        
        return matchesSearch && matchesCategory && matchesStatus;
    });
    
    if (filtered.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="empty-cell">No projects match your filters</td></tr>';
        return;
    }
    
    filtered.forEach(project => {
        tableBody.appendChild(createProjectRow(project));
    });
}

// ============================================
// CHARACTER COUNTER
// ============================================
document.getElementById('projectShortDesc')?.addEventListener('input', (e) => {
    document.getElementById('shortDescCount').textContent = e.target.value.length;
});

// ============================================
// NOTIFICATION HELPER
// ============================================
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============================================
// INITIALIZE
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    await loadProjects();
});