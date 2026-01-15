// ============================================
// ADMIN DASHBOARD
// ============================================

let dashboardData = {
    projects: 0,
    team: 0,
    blog: 0,
    quotes: 0,
    pendingQuotes: 0,
    contacts: 0,
    newContacts: 0
};

// ============================================
// LOAD DASHBOARD STATS
// ============================================
async function loadDashboardStats() {
    try {
        // Load projects count
        const projectsSnapshot = await db.collection('projects').get();
        dashboardData.projects = projectsSnapshot.size;
        document.getElementById('totalProjects').textContent = projectsSnapshot.size;
        
        // Load team count
        const teamSnapshot = await db.collection('team').where('status', '==', 'Active').get();
        dashboardData.team = teamSnapshot.size;
        document.getElementById('totalTeam').textContent = teamSnapshot.size;
        
        // Load blog count
        const blogSnapshot = await db.collection('blog').where('status', '==', 'Published').get();
        dashboardData.blog = blogSnapshot.size;
        document.getElementById('totalBlog').textContent = blogSnapshot.size;
        
        // Load quotes count
        const quotesSnapshot = await db.collection('quotes').get();
        dashboardData.quotes = quotesSnapshot.size;
        document.getElementById('totalQuotes').textContent = quotesSnapshot.size;
        
        // Count pending quotes
        const pendingQuotesSnapshot = await db.collection('quotes')
            .where('status', '==', 'New')
            .get();
        dashboardData.pendingQuotes = pendingQuotesSnapshot.size;
        document.getElementById('pendingQuotes').textContent = pendingQuotesSnapshot.size;
        
        // Update badge
        const quotesBadge = document.getElementById('quotesBadge');
        if (quotesBadge) {
            quotesBadge.textContent = dashboardData.pendingQuotes;
            quotesBadge.style.display = dashboardData.pendingQuotes > 0 ? 'flex' : 'none';
        }
        
        // Load contacts count
        const contactsSnapshot = await db.collection('contacts').get();
        dashboardData.contacts = contactsSnapshot.size;
        
        // Count new contacts
        const newContactsSnapshot = await db.collection('contacts')
            .where('status', '==', 'New')
            .get();
        dashboardData.newContacts = newContactsSnapshot.size;
        
        // Update badge
        const contactsBadge = document.getElementById('contactsBadge');
        if (contactsBadge) {
            contactsBadge.textContent = dashboardData.newContacts;
            contactsBadge.style.display = dashboardData.newContacts > 0 ? 'flex' : 'none';
        }
        
        // Calculate this month's additions
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const recentProjectsSnapshot = await db.collection('projects')
            .where('createdAt', '>=', firstDayOfMonth)
            .get();
        document.getElementById('projectsChange').textContent = recentProjectsSnapshot.size;
        
        const recentBlogSnapshot = await db.collection('blog')
            .where('status', '==', 'Published')
            .where('publishedDate', '>=', firstDayOfMonth)
            .get();
        document.getElementById('blogChange').textContent = recentBlogSnapshot.size;
        
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// ============================================
// LOAD RECENT QUOTES
// ============================================
async function loadRecentQuotes() {
    const tableBody = document.querySelector('#recentQuotesTable tbody');
    
    try {
        const querySnapshot = await db.collection('quotes')
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();
        
        tableBody.innerHTML = '';
        
        if (querySnapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="5" class="empty-cell">No quote requests yet</td></tr>';
            return;
        }
        
        querySnapshot.forEach(doc => {
            const quote = doc.data();
            const row = document.createElement('tr');
            row.style.cursor = 'pointer';
            row.onclick = () => window.location.href = `quotes.html?id=${doc.id}`;
            
            const statusClass = getStatusClass(quote.status);
            const date = quote.createdAt ? formatDate(quote.createdAt) : 'N/A';
            
            row.innerHTML = `
                <td><code>${quote.referenceNumber}</code></td>
                <td>${quote.clientName}</td>
                <td>${quote.projectType}</td>
                <td><span class="status-badge ${statusClass}">${quote.status}</span></td>
                <td>${date}</td>
            `;
            
            tableBody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading recent quotes:', error);
        tableBody.innerHTML = '<tr><td colspan="5" class="error-cell">Failed to load quotes</td></tr>';
    }
}

// ============================================
// LOAD RECENT CONTACTS
// ============================================
async function loadRecentContacts() {
    const tableBody = document.querySelector('#recentContactsTable tbody');
    
    try {
        const querySnapshot = await db.collection('contacts')
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();
        
        tableBody.innerHTML = '';
        
        if (querySnapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="5" class="empty-cell">No contact inquiries yet</td></tr>';
            return;
        }
        
        querySnapshot.forEach(doc => {
            const contact = doc.data();
            const row = document.createElement('tr');
            row.style.cursor = 'pointer';
            row.onclick = () => window.location.href = `contacts.html?id=${doc.id}`;
            
            const statusClass = getStatusClass(contact.status);
            const date = contact.createdAt ? formatDate(contact.createdAt) : 'N/A';
            
            row.innerHTML = `
                <td>${contact.name}</td>
                <td>${contact.email}</td>
                <td>${contact.subject}</td>
                <td><span class="status-badge ${statusClass}">${contact.status}</span></td>
                <td>${date}</td>
            `;
            
            tableBody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading recent contacts:', error);
        tableBody.innerHTML = '<tr><td colspan="5" class="error-cell">Failed to load contacts</td></tr>';
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function getStatusClass(status) {
    const statusMap = {
        'New': 'status-new',
        'Reviewed': 'status-reviewed',
        'Contacted': 'status-contacted',
        'Quoted': 'status-quoted',
        'Closed': 'status-closed',
        'Replied': 'status-replied'
    };
    return statusMap[status] || 'status-new';
}

function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

// ============================================
// INITIALIZE DASHBOARD
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📊 Loading dashboard...');
    
    // Wait for auth check
    await checkAuth();
    
    // Load all dashboard data
    await Promise.all([
        loadDashboardStats(),
        loadRecentQuotes(),
        loadRecentContacts()
    ]);
    
    console.log('✅ Dashboard loaded successfully');
});