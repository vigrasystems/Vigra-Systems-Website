// ============================================
// ADMIN QUOTES MANAGEMENT
// ============================================

let allQuotes = [];
let currentQuoteId = null;

// ============================================
// LOAD ALL QUOTES
// ============================================
async function loadQuotes() {
    const tableBody = document.querySelector('#quotesTable tbody');
    
    try {
        const querySnapshot = await db.collection('quotes')
            .orderBy('createdAt', 'desc')
            .get();
        
        tableBody.innerHTML = '';
        allQuotes = [];
        
        if (querySnapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="8" class="empty-cell">No quote requests yet</td></tr>';
            return;
        }
        
        querySnapshot.forEach(doc => {
            const quote = { id: doc.id, ...doc.data() };
            allQuotes.push(quote);
            tableBody.appendChild(createQuoteRow(quote));
        });
        
    } catch (error) {
        console.error('Error loading quotes:', error);
        tableBody.innerHTML = '<tr><td colspan="8" class="error-cell">Failed to load quotes</td></tr>';
    }
}

// ============================================
// CREATE QUOTE ROW
// ============================================
function createQuoteRow(quote) {
    const row = document.createElement('tr');
    row.style.cursor = 'pointer';
    row.onclick = () => viewQuote(quote.id);
    
    const statusClass = getStatusClass(quote.status);
    const date = quote.createdAt ? formatDate(quote.createdAt) : 'N/A';
    
    row.innerHTML = `
        <td><code>${quote.referenceNumber}</code></td>
        <td>${quote.clientName}</td>
        <td>${quote.companyName}</td>
        <td><span class="badge badge-primary">${quote.projectType}</span></td>
        <td>${quote.timeline}</td>
        <td>
            <select class="status-select" onchange="updateQuoteStatus('${quote.id}', this.value)" onclick="event.stopPropagation()">
                <option value="New" ${quote.status === 'New' ? 'selected' : ''}>New</option>
                <option value="Reviewed" ${quote.status === 'Reviewed' ? 'selected' : ''}>Reviewed</option>
                <option value="Contacted" ${quote.status === 'Contacted' ? 'selected' : ''}>Contacted</option>
                <option value="Quoted" ${quote.status === 'Quoted' ? 'selected' : ''}>Quoted</option>
                <option value="Closed" ${quote.status === 'Closed' ? 'selected' : ''}>Closed</option>
            </select>
        </td>
        <td>${date}</td>
        <td>
            <button class="btn-icon btn-icon-primary" onclick="event.stopPropagation(); viewQuote('${quote.id}')" title="View Details">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                </svg>
            </button>
        </td>
    `;
    
    return row;
}

// ============================================
// VIEW QUOTE DETAILS
// ============================================
async function viewQuote(quoteId) {
    currentQuoteId = quoteId;
    const quote = allQuotes.find(q => q.id === quoteId);
    
    if (!quote) return;
    
    const detailsContainer = document.getElementById('quoteDetails');
    const date = quote.createdAt ? formatDate(quote.createdAt) : 'N/A';
    
    const attachmentsHTML = quote.attachments && quote.attachments.length > 0
        ? quote.attachments.map(url => `
            <a href="${url}" target="_blank" class="attachment-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/>
                    <polyline points="13 2 13 9 20 9"/>
                </svg>
                View Attachment
            </a>
          `).join('')
        : '<p class="text-muted">No attachments</p>';
    
    detailsContainer.innerHTML = `
        <div class="quote-detail-grid">
            <div class="detail-section">
                <h3>Client Information</h3>
                <dl>
                    <dt>Name:</dt><dd>${quote.clientName}</dd>
                    <dt>Company:</dt><dd>${quote.companyName}</dd>
                    <dt>Email:</dt><dd><a href="mailto:${quote.email}">${quote.email}</a></dd>
                    <dt>Phone:</dt><dd><a href="tel:${quote.phone}">${quote.phone}</a></dd>
                </dl>
            </div>
            
            <div class="detail-section">
                <h3>Project Details</h3>
                <dl>
                    <dt>Reference Number:</dt><dd><code>${quote.referenceNumber}</code></dd>
                    <dt>Project Type:</dt><dd>${quote.projectType}</dd>
                    <dt>Timeline:</dt><dd>${quote.timeline}</dd>
                    <dt>Budget Range:</dt><dd>${quote.budgetRange || 'Not specified'}</dd>
                    <dt>Date Submitted:</dt><dd>${date}</dd>
                </dl>
            </div>
            
            <div class="detail-section full-width">
                <h3>Project Description</h3>
                <p>${quote.projectDescription}</p>
            </div>
            
            <div class="detail-section full-width">
                <h3>Attachments</h3>
                ${attachmentsHTML}
            </div>
            
            <div class="detail-section full-width">
                <h3>Admin Notes</h3>
                <textarea id="adminNotes" rows="4" placeholder="Add internal notes...">${quote.adminNotes || ''}</textarea>
                <button class="btn btn-primary btn-sm" onclick="saveNotes()">Save Notes</button>
            </div>
        </div>
    `;
    
    document.getElementById('quoteModal').classList.add('active');
}

window.viewQuote = viewQuote;

function closeQuoteModal() {
    document.getElementById('quoteModal').classList.remove('active');
}

window.closeQuoteModal = closeQuoteModal;

// ============================================
// UPDATE QUOTE STATUS
// ============================================
async function updateQuoteStatus(quoteId, newStatus) {
    try {
        await db.collection('quotes').doc(quoteId).update({
            status: newStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Update local array
        const quote = allQuotes.find(q => q.id === quoteId);
        if (quote) quote.status = newStatus;
        
        showNotification('Status updated successfully!', 'success');
    } catch (error) {
        console.error('Error updating status:', error);
        showNotification('Failed to update status', 'error');
    }
}

window.updateQuoteStatus = updateQuoteStatus;

// ============================================
// SAVE ADMIN NOTES
// ============================================
async function saveNotes() {
    if (!currentQuoteId) return;
    
    const notes = document.getElementById('adminNotes').value;
    
    try {
        await db.collection('quotes').doc(currentQuoteId).update({
            adminNotes: notes,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showNotification('Notes saved successfully!', 'success');
    } catch (error) {
        console.error('Error saving notes:', error);
        showNotification('Failed to save notes', 'error');
    }
}

window.saveNotes = saveNotes;

// ============================================
// FILTER QUOTES
// ============================================
document.getElementById('searchQuotes')?.addEventListener('input', filterQuotes);
document.getElementById('filterStatus')?.addEventListener('change', filterQuotes);

function filterQuotes() {
    const searchTerm = document.getElementById('searchQuotes').value.toLowerCase();
    const status = document.getElementById('filterStatus').value;
    
    const tableBody = document.querySelector('#quotesTable tbody');
    tableBody.innerHTML = '';
    
    const filtered = allQuotes.filter(quote => {
        const matchesSearch = !searchTerm || 
            quote.referenceNumber.toLowerCase().includes(searchTerm) ||
            quote.clientName.toLowerCase().includes(searchTerm) ||
            quote.companyName.toLowerCase().includes(searchTerm);
        
        const matchesStatus = !status || quote.status === status;
        
        return matchesSearch && matchesStatus;
    });
    
    if (filtered.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="empty-cell">No quotes match your filters</td></tr>';
        return;
    }
    
    filtered.forEach(quote => tableBody.appendChild(createQuoteRow(quote)));
}

// ============================================
// HELPERS
// ============================================
function getStatusClass(status) {
    const map = {
        'New': 'status-new',
        'Reviewed': 'status-reviewed',
        'Contacted': 'status-contacted',
        'Quoted': 'status-quoted',
        'Closed': 'status-closed'
    };
    return map[status] || 'status-new';
}

function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

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
    await loadQuotes();
});