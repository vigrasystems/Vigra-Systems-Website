// ============================================
// ADMIN TEAM MANAGEMENT
// ============================================

let allMembers = [];
let currentEditId = null;
let deleteMemberId = null;
let photoFile = null;

// ============================================
// LOAD ALL TEAM MEMBERS
// ============================================
async function loadTeam() {
    const teamGrid = document.getElementById('teamGrid');
    
    try {
        const querySnapshot = await db.collection('team')
            .orderBy('order', 'asc')
            .get();
        
        teamGrid.innerHTML = '';
        allMembers = [];
        
        if (querySnapshot.empty) {
            teamGrid.innerHTML = '<div class="empty-state-admin">No team members yet. Click "Add Team Member" to get started.</div>';
            return;
        }
        
        querySnapshot.forEach(doc => {
            const member = { id: doc.id, ...doc.data() };
            allMembers.push(member);
            
            const card = createMemberCard(member);
            teamGrid.appendChild(card);
        });
        
    } catch (error) {
        console.error('Error loading team:', error);
        teamGrid.innerHTML = '<div class="error-state-admin">Failed to load team members</div>';
    }
}

// ============================================
// CREATE MEMBER CARD
// ============================================
function createMemberCard(member) {
    const card = document.createElement('div');
    card.className = 'team-admin-card';
    
    const photo = member.photoUrl 
        ? `<img src="${member.photoUrl}" alt="${member.name}">` 
        : `<div class="photo-placeholder">${getInitials(member.name)}</div>`;
    
    const statusBadge = member.status === 'Active' 
        ? '<span class="badge badge-success">Active</span>' 
        : '<span class="badge badge-secondary">Alumni</span>';
    
    const socialLinks = [];
    if (member.socialLinks?.linkedin) socialLinks.push('LinkedIn');
    if (member.socialLinks?.github) socialLinks.push('GitHub');
    if (member.socialLinks?.twitter) socialLinks.push('Twitter');
    if (member.socialLinks?.website) socialLinks.push('Website');
    
    const expertiseHTML = (member.expertise || []).slice(0, 3).map(skill => 
        `<span class="expertise-tag-small">${skill}</span>`
    ).join('');
    
    card.innerHTML = `
        <div class="member-photo">
            ${photo}
            ${statusBadge}
        </div>
        <div class="member-info">
            <h3>${member.name}</h3>
            <p class="member-designation">${member.designation}</p>
            <p class="member-bio-short">${truncate(member.bio, 80)}</p>
            ${expertiseHTML ? `<div class="member-expertise">${expertiseHTML}</div>` : ''}
            ${socialLinks.length > 0 ? `<p class="member-social-count">Social: ${socialLinks.join(', ')}</p>` : ''}
        </div>
        <div class="member-actions">
            <button class="btn btn-sm btn-secondary" onclick="editMember('${member.id}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit
            </button>
            <button class="btn btn-sm btn-danger-outline" onclick="deleteMember('${member.id}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
                Delete
            </button>
        </div>
    `;
    
    return card;
}

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function truncate(text, length) {
    return text && text.length > length ? text.substring(0, length) + '...' : text;
}

// ============================================
// OPEN TEAM MODAL
// ============================================
function openTeamModal(memberId = null) {
    const modal = document.getElementById('teamModal');
    const form = document.getElementById('teamForm');
    const modalTitle = document.getElementById('modalTitle');
    
    form.reset();
    currentEditId = memberId;
    photoFile = null;
    document.getElementById('photoPreview').innerHTML = '';
    
    if (memberId) {
        modalTitle.textContent = 'Edit Team Member';
        const member = allMembers.find(m => m.id === memberId);
        
        if (member) {
            document.getElementById('memberId').value = member.id;
            document.getElementById('memberName').value = member.name;
            document.getElementById('memberDesignation').value = member.designation;
            document.getElementById('memberRole').value = member.role || 'member';
            document.getElementById('memberBio').value = member.bio || '';
            document.getElementById('memberExpertise').value = (member.expertise || []).join(', ');
            document.getElementById('memberEmail').value = member.email || '';
            document.getElementById('memberReceiveQuotes').checked = member.receiveQuotes || false;
            document.getElementById('memberLinkedin').value = member.socialLinks?.linkedin || '';
            document.getElementById('memberGithub').value = member.socialLinks?.github || '';
            document.getElementById('memberTwitter').value = member.socialLinks?.twitter || '';
            document.getElementById('memberWebsite').value = member.socialLinks?.website || '';
            document.getElementById('memberStatus').value = member.status || 'Active';
            document.getElementById('memberOrder').value = member.order;
            
            if (member.photoUrl) {
                document.getElementById('photoPreview').innerHTML = `
                    <img src="${member.photoUrl}" alt="Current photo">
                    <p class="text-sm text-muted">Current photo (upload new to replace)</p>
                `;
            }
        }
    } else {
        modalTitle.textContent = 'Add Team Member';
        document.getElementById('memberId').value = '';
    }
    
    modal.classList.add('active');
}

window.openTeamModal = openTeamModal;

function closeTeamModal() {
    document.getElementById('teamModal').classList.remove('active');
}

window.closeTeamModal = closeTeamModal;

// ============================================
// HANDLE PHOTO UPLOAD
// ============================================
document.getElementById('memberPhoto')?.addEventListener('change', (e) => {
    photoFile = e.target.files[0];
    const preview = document.getElementById('photoPreview');
    
    if (photoFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(photoFile);
    }
});

// ============================================
// SAVE TEAM MEMBER
// ============================================
document.getElementById('teamForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const saveBtn = document.getElementById('saveMemberBtn');
    const btnText = saveBtn.querySelector('.btn-text');
    const btnLoading = saveBtn.querySelector('.btn-loading');
    
    saveBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    
    try {
        let photoUrl = null;
        
        if (photoFile) {
            const storageRef = storage.ref(`team/${Date.now()}_${photoFile.name}`);
            const snapshot = await storageRef.put(photoFile);
            photoUrl = await snapshot.ref.getDownloadURL();
        } else if (currentEditId) {
            const existingMember = allMembers.find(m => m.id === currentEditId);
            photoUrl = existingMember?.photoUrl;
        }
        
        const expertise = document.getElementById('memberExpertise').value
            .split(',')
            .map(e => e.trim())
            .filter(e => e);
        
        const memberData = {
            name: document.getElementById('memberName').value.trim(),
            designation: document.getElementById('memberDesignation').value.trim(),
            role: document.getElementById('memberRole').value,
            bio: document.getElementById('memberBio').value.trim(),
            expertise: expertise,
            email: document.getElementById('memberEmail').value.trim() || null,
            receiveQuotes: document.getElementById('memberReceiveQuotes').checked,
            socialLinks: {
                linkedin: document.getElementById('memberLinkedin').value.trim() || null,
                github: document.getElementById('memberGithub').value.trim() || null,
                twitter: document.getElementById('memberTwitter').value.trim() || null,
                website: document.getElementById('memberWebsite').value.trim() || null
            },
            status: document.getElementById('memberStatus').value,
            order: parseInt(document.getElementById('memberOrder').value),
            photoUrl: photoUrl
        };
        
        if (currentEditId) {
            await db.collection('team').doc(currentEditId).update(memberData);
        } else {
            memberData.joinDate = firebase.firestore.FieldValue.serverTimestamp();
            memberData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('team').add(memberData);
        }
        
        await loadTeam();
        closeTeamModal();
        showNotification('Team member saved successfully!', 'success');
        
    } catch (error) {
        console.error('Error saving team member:', error);
        showNotification('Failed to save team member.', 'error');
    } finally {
        saveBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
});

// ============================================
// EDIT MEMBER
// ============================================
function editMember(memberId) {
    openTeamModal(memberId);
}

window.editMember = editMember;

// ============================================
// DELETE MEMBER
// ============================================
function deleteMember(memberId) {
    deleteMemberId = memberId;
    document.getElementById('deleteModal').classList.add('active');
}

window.deleteMember = deleteMember;

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('active');
    deleteMemberId = null;
}

window.closeDeleteModal = closeDeleteModal;

async function confirmDelete() {
    if (!deleteMemberId) return;
    
    try {
        await db.collection('team').doc(deleteMemberId).delete();
        await loadTeam();
        closeDeleteModal();
        showNotification('Team member deleted successfully!', 'success');
    } catch (error) {
        console.error('Error deleting team member:', error);
        showNotification('Failed to delete team member.', 'error');
    }
}

window.confirmDelete = confirmDelete;

// ============================================
// CHARACTER COUNTER
// ============================================
document.getElementById('memberBio')?.addEventListener('input', (e) => {
    document.getElementById('bioCount').textContent = e.target.value.length;
});

// ============================================
// NOTIFICATION HELPER
// ============================================
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
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
    await loadTeam();
});