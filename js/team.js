// ============================================
// TEAM PAGE JAVASCRIPT
// ============================================

// ============================================
// LOAD TEAM MEMBERS
// ============================================
async function loadTeamMembers() {
    const teamGrid = document.getElementById('teamGrid');

    if (!teamGrid) {
        // Silently return - this script may be loaded on non-team pages
        return;
    }

    console.log('👥 Starting to load team members...');

    if (!window.db) {
        console.error('❌ Firestore not initialized!');
        teamGrid.innerHTML = '<div class="empty-state-admin">Firestore not initialized. Check firebase-config.js</div>';
        return;
    }

    try {
        console.log('📡 Fetching team collection...');

        // SIMPLIFIED QUERY - No compound index needed
        // Just get all active team members, sort in JavaScript
        const querySnapshot = await db.collection('team')
            .where('status', '==', 'Active')
            .get();

        console.log('✅ Query completed. Documents found:', querySnapshot.size);

        teamGrid.innerHTML = '';

        if (querySnapshot.empty) {
            console.warn('⚠️ No team members found in database');
            teamGrid.innerHTML = `
                <div class="empty-state-admin">
                    <h3>No Team Members Found</h3>
                    <p>The team collection is empty. Please populate the database.</p>
                    <a href="../populate-database.html" class="btn btn-primary" style="margin-top: 1rem;">Populate Database</a>
                </div>
            `;
            return;
        }

        // Convert to array and sort by order in JavaScript
        const members = [];
        querySnapshot.forEach(doc => {
            members.push({ id: doc.id, ...doc.data() });
        });

        // Sort by order field
        members.sort((a, b) => (a.order || 999) - (b.order || 999));

        // Render sorted members
        members.forEach(member => {
            console.log('👤 Loading member:', member.name);
            const card = createMemberCard(member);
            teamGrid.appendChild(card);
        });

        console.log('✅ All team members loaded successfully!');

    } catch (error) {
        console.error('❌ Error loading team members:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);

        let errorMessage = 'Failed to load team members. ';

        if (error.code === 'permission-denied') {
            errorMessage += 'Permission denied. Check Firestore security rules.';
        } else if (error.code === 'unavailable') {
            errorMessage += 'Network error. Check your internet connection.';
        } else if (error.message.includes('index')) {
            errorMessage += 'Database index issue. Loading all members...';
            // Fallback: try without where clause
            loadAllTeamMembers();
            return;
        } else {
            errorMessage += error.message;
        }

        if (teamGrid) {
            teamGrid.innerHTML = `
                <div class="error-state-admin">
                    <h3>Error Loading Team Members</h3>
                    <p>${errorMessage}</p>
                    <button onclick="loadTeamMembers()" class="btn btn-primary" style="margin-top: 1rem;">Retry</button>
                </div>
            `;
        }
    }
}

// ============================================
// FALLBACK: Load all team members (no filters)
// ============================================
async function loadAllTeamMembers() {
    const teamGrid = document.getElementById('teamGrid');

    try {
        console.log('📡 Loading all team members (no filters)...');

        const querySnapshot = await db.collection('team').get();

        teamGrid.innerHTML = '';

        if (querySnapshot.empty) {
            teamGrid.innerHTML = '<div class="empty-state-admin">No team members found. Please populate the database.</div>';
            return;
        }

        const members = [];
        querySnapshot.forEach(doc => {
            const data = doc.data();
            if (data.status === 'Active' || !data.status) {
                members.push({ id: doc.id, ...data });
            }
        });

        members.sort((a, b) => (a.order || 999) - (b.order || 999));

        members.forEach(member => {
            const card = createMemberCard(member);
            teamGrid.appendChild(card);
        });

        console.log('✅ Team members loaded via fallback method');

    } catch (error) {
        console.error('❌ Fallback also failed:', error);
        if (teamGrid) {
            teamGrid.innerHTML = '<div class="error-state-admin">Unable to load team members. Please check Firebase configuration.</div>';
        }
    }
}

// ============================================
// CREATE MEMBER CARD
// ============================================
function createMemberCard(member) {
    const card = document.createElement('div');
    card.className = 'team-card fade-in-up';

    const photo = member.photoUrl
        ? `<img src="${member.photoUrl}" alt="${member.name}" class="team-photo">`
        : `<div class="team-photo-placeholder">${getInitials(member.name)}</div>`;

    const expertise = (member.expertise || []).slice(0, 3).map(skill =>
        `<span class="expertise-tag">${skill}</span>`
    ).join('');

    const socialLinks = [];
    if (member.socialLinks?.linkedin) {
        socialLinks.push(`
            <a href="${member.socialLinks.linkedin}" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="LinkedIn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
            </a>
        `);
    }
    if (member.socialLinks?.github) {
        socialLinks.push(`
            <a href="${member.socialLinks.github}" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="GitHub">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
            </a>
        `);
    }

    card.innerHTML = `
        ${photo}
        <div class="team-info">
            <h3 class="team-name">${member.name}</h3>
            <p class="team-designation">${member.designation}</p>
            <p class="team-bio">${member.bio || ''}</p>
            ${expertise ? `<div class="team-expertise">${expertise}</div>` : ''}
            ${socialLinks.length > 0 ? `<div class="team-social">${socialLinks.join('')}</div>` : ''}
        </div>
    `;

    return card;
}

function getInitials(name) {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// ============================================
// INITIALIZE
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('👥 Team page loaded');

    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase SDK not loaded!');
        const teamGrid = document.getElementById('teamGrid');
        if (teamGrid) {
            teamGrid.innerHTML = '<div class="error-state-admin">Firebase SDK not loaded. Check your internet connection.</div>';
        }
        return;
    }

    if (!window.db) {
        console.error('❌ Firestore not initialized!');
        const teamGrid = document.getElementById('teamGrid');
        if (teamGrid) {
            teamGrid.innerHTML = '<div class="error-state-admin">Firestore not initialized. Check firebase-config.js</div>';
        }
        return;
    }

    loadTeamMembers();
});