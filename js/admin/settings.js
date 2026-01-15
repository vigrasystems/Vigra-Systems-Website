// ============================================
// ADMIN SETTINGS
// ============================================

// ============================================
// LOAD SETTINGS
// ============================================
async function loadSettings() {
    try {
        const doc = await db.collection('settings').doc('site-config').get();
        
        if (doc.exists) {
            const settings = doc.data();
            
            // Company Info
            document.getElementById('companyName').value = settings.companyInfo?.name || 'Vigra-Systems';
            document.getElementById('companyTagline').value = settings.companyInfo?.tagline || '';
            document.getElementById('companyEmail').value = settings.companyInfo?.email || 'info@vigra-systems.com';
            document.getElementById('companyPhone').value = settings.companyInfo?.phone || '+1 (234) 567-890';
            document.getElementById('companyAddress').value = settings.companyInfo?.address || 'Innovation Hub, Tech District';
            
            // Social Links
            document.getElementById('socialLinkedin').value = settings.companyInfo?.socialLinks?.linkedin || '';
            document.getElementById('socialTwitter').value = settings.companyInfo?.socialLinks?.twitter || '';
            document.getElementById('socialGithub').value = settings.companyInfo?.socialLinks?.github || '';
            
            // Email Settings
            document.getElementById('quoteEmails').value = (settings.emailNotifications?.quoteTo || []).join(', ');
            document.getElementById('contactEmails').value = (settings.emailNotifications?.contactTo || []).join(', ');
            
            // Homepage
            document.getElementById('heroTitle').value = settings.homepage?.heroTitle || 'Reverse Engineering Redefined';
            document.getElementById('heroSubtitle').value = settings.homepage?.heroSubtitle || '';
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// ============================================
// SAVE COMPANY INFO
// ============================================
document.getElementById('companyForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const companyData = {
        'companyInfo.name': document.getElementById('companyName').value,
        'companyInfo.tagline': document.getElementById('companyTagline').value,
        'companyInfo.email': document.getElementById('companyEmail').value,
        'companyInfo.phone': document.getElementById('companyPhone').value,
        'companyInfo.address': document.getElementById('companyAddress').value
    };
    
    try {
        await db.collection('settings').doc('site-config').set(companyData, { merge: true });
        showNotification('Company information saved!', 'success');
    } catch (error) {
        console.error('Error saving company info:', error);
        showNotification('Failed to save company information', 'error');
    }
});

// ============================================
// SAVE SOCIAL LINKS
// ============================================
document.getElementById('socialForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const socialData = {
        'companyInfo.socialLinks': {
            linkedin: document.getElementById('socialLinkedin').value,
            twitter: document.getElementById('socialTwitter').value,
            github: document.getElementById('socialGithub').value
        }
    };
    
    try {
        await db.collection('settings').doc('site-config').set(socialData, { merge: true });
        showNotification('Social links saved!', 'success');
    } catch (error) {
        console.error('Error saving social links:', error);
        showNotification('Failed to save social links', 'error');
    }
});

// ============================================
// SAVE EMAIL SETTINGS
// ============================================
document.getElementById('emailForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const quoteEmails = document.getElementById('quoteEmails').value
        .split(',')
        .map(e => e.trim())
        .filter(e => e);
    
    const contactEmails = document.getElementById('contactEmails').value
        .split(',')
        .map(e => e.trim())
        .filter(e => e);
    
    const emailData = {
        emailNotifications: {
            quoteTo: quoteEmails,
            contactTo: contactEmails
        }
    };
    
    try {
        await db.collection('settings').doc('site-config').set(emailData, { merge: true });
        showNotification('Email settings saved!', 'success');
    } catch (error) {
        console.error('Error saving email settings:', error);
        showNotification('Failed to save email settings', 'error');
    }
});

// ============================================
// SAVE HOMEPAGE SETTINGS
// ============================================
document.getElementById('homepageForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const homepageData = {
        homepage: {
            heroTitle: document.getElementById('heroTitle').value,
            heroSubtitle: document.getElementById('heroSubtitle').value
        }
    };
    
    try {
        await db.collection('settings').doc('site-config').set(homepageData, { merge: true });
        showNotification('Homepage settings saved!', 'success');
    } catch (error) {
        console.error('Error saving homepage settings:', error);
        showNotification('Failed to save homepage settings', 'error');
    }
});

// ============================================
// DANGER ZONE FUNCTIONS
// ============================================
async function clearQuotes() {
    if (!confirm('Are you sure? This will permanently delete ALL quote requests. This action cannot be undone!')) {
        return;
    }
    
    if (!confirm('Final confirmation: Delete all quotes?')) {
        return;
    }
    
    try {
        const snapshot = await db.collection('quotes').get();
        const batch = db.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        showNotification('All quotes deleted', 'success');
    } catch (error) {
        console.error('Error clearing quotes:', error);
        showNotification('Failed to clear quotes', 'error');
    }
}

async function clearContacts() {
    if (!confirm('Are you sure? This will permanently delete ALL contact inquiries. This action cannot be undone!')) {
        return;
    }
    
    if (!confirm('Final confirmation: Delete all contacts?')) {
        return;
    }
    
    try {
        const snapshot = await db.collection('contacts').get();
        const batch = db.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        showNotification('All contacts deleted', 'success');
    } catch (error) {
        console.error('Error clearing contacts:', error);
        showNotification('Failed to clear contacts', 'error');
    }
}

window.clearQuotes = clearQuotes;
window.clearContacts = clearContacts;

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
    await loadSettings();
});