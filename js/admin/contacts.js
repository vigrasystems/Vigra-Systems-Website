// Similar structure to quotes.js
let allContacts = [];

async function loadContacts() {
    const tableBody = document.querySelector('#contactsTable tbody');
    try {
        const querySnapshot = await db.collection('contacts').orderBy('createdAt', 'desc').get();
        tableBody.innerHTML = '';
        allContacts = [];
        
        if (querySnapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="6" class="empty-cell">No contact inquiries yet</td></tr>';
            return;
        }
        
        querySnapshot.forEach(doc => {
            const contact = { id: doc.id, ...doc.data() };
            allContacts.push(contact);
            tableBody.appendChild(createContactRow(contact));
        });
    } catch (error) {
        console.error('Error loading contacts:', error);
        tableBody.innerHTML = '<tr><td colspan="6" class="error-cell">Failed to load contacts</td></tr>';
    }
}

function createContactRow(contact) {
    const row = document.createElement('tr');
    const date = contact.createdAt ? new Date(contact.createdAt.toDate()).toLocaleDateString() : 'N/A';
    
    row.innerHTML = `
        <td>${contact.name}</td>
        <td><a href="mailto:${contact.email}">${contact.email}</a></td>
        <td>${contact.subject}</td>
        <td>
            <select class="status-select" onchange="updateContactStatus('${contact.id}', this.value)">
                <option value="New" ${contact.status === 'New' ? 'selected' : ''}>New</option>
                <option value="Replied" ${contact.status === 'Replied' ? 'selected' : ''}>Replied</option>
                <option value="Closed" ${contact.status === 'Closed' ? 'selected' : ''}>Closed</option>
            </select>
        </td>
        <td>${date}</td>
        <td>
            <button class="btn-icon btn-icon-primary" onclick="viewContact('${contact.id}')" title="View">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                </svg>
            </button>
        </td>
    `;
    return row;
}

async function updateContactStatus(contactId, newStatus) {
    try {
        await db.collection('contacts').doc(contactId).update({ status: newStatus });
        const contact = allContacts.find(c => c.id === contactId);
        if (contact) contact.status = newStatus;
    } catch (error) {
        console.error('Error updating status:', error);
    }
}

function viewContact(contactId) {
    const contact = allContacts.find(c => c.id === contactId);
    if (contact) {
        alert(`Name: ${contact.name}\nEmail: ${contact.email}\nMessage: ${contact.message}`);
    }
}

window.updateContactStatus = updateContactStatus;
window.viewContact = viewContact;

document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    await loadContacts();
});