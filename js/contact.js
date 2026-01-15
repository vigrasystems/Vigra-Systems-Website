// ============================================
// CONTACT PAGE JAVASCRIPT
// ============================================

// ============================================
// FORM VALIDATION
// ============================================
function validateContactForm(formData) {
    const errors = [];

    // Name validation
    if (!formData.name || formData.name.trim().length < 2) {
        errors.push('Please enter a valid name');
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
        errors.push('Please enter a valid email address');
    }

    // Subject validation
    if (!formData.subject) {
        errors.push('Please select a subject');
    }

    // Message validation
    if (!formData.message || formData.message.trim().length < 10) {
        errors.push('Message must be at least 10 characters long');
    }

    return errors;
}

// ============================================
// SUBMIT CONTACT FORM
// ============================================
async function submitContactForm(e) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');

    // Get form data
    const formData = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        subject: form.subject.value,
        message: form.message.value.trim(),
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'New'
    };

    // Validate form
    const errors = validateContactForm(formData);
    if (errors.length > 0) {
        errorMessage.querySelector('p').textContent = errors.join('. ');
        errorMessage.style.display = 'flex';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
        return;
    }

    // Show loading state
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'flex';
    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';

    try {
        // Save to Firestore
        await db.collection('contacts').add(formData);

        // Send email notification using EmailJS (optional)
        await sendContactEmail(formData);

        // Show success message
        successMessage.style.display = 'flex';
        form.reset();

        // Reset character counter
        const charCount = document.getElementById('charCount');
        if (charCount) {
            charCount.textContent = '0';
        }

        // Track in Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'contact_form_submit', {
                'subject': formData.subject
            });
        }

        // Scroll to success message
        successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });

    } catch (error) {
        console.error('Error submitting contact form:', error);
        errorMessage.querySelector('p').textContent = 'Failed to send message. Please try again later.';
        errorMessage.style.display = 'flex';
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
}

// ============================================
// SEND CONTACT EMAIL (EmailJS Integration)
// ============================================
async function sendContactEmail(formData) {
    // Check if EmailJS is loaded
    if (typeof emailjs === 'undefined') {
        console.warn('⚠️ EmailJS not loaded, skipping email notification');
        return;
    }

    // EmailJS Information
    const SERVICE_ID = 'service_hgoc2xs';
    const TEMPLATE_ID = 'template_mvhaykp';

    try {
        const templateParams = {
            from_name: formData.name,
            from_email: formData.email,
            phone: formData.phone || 'Not provided',
            subject: formData.subject,
            message: formData.message,
            to_email: 'vigrasystems@gmail.com'
        };

        await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams);
        console.log('✅ Email notification sent successfully');

    } catch (error) {
        console.error('❌ Error sending email:', error);
        // We don't throw, allowing the form to succeed even if email fails
    }
}

// ============================================
// CHARACTER COUNTER
// ============================================
function updateCharCount() {
    const messageField = document.getElementById('message');
    const charCount = document.getElementById('charCount');

    if (messageField && charCount) {
        messageField.addEventListener('input', () => {
            const length = messageField.value.length;
            charCount.textContent = length;

            // Change color if approaching limit
            if (length > 900) {
                charCount.style.color = 'var(--warning)';
            } else {
                charCount.style.color = 'var(--gray-600)';
            }
        });
    }
}

// ============================================
// CHECK URL PARAMETERS (Pre-fill subject)
// ============================================
function checkURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const subject = urlParams.get('subject');

    if (subject) {
        const subjectField = document.getElementById('subject');
        if (subjectField) {
            subjectField.value = subject;
        }
    }
}

// ============================================
// EVENT LISTENERS
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('📧 Contact page loaded');

    // Form submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', submitContactForm);
    }

    // Character counter
    updateCharCount();

    // Check URL parameters
    checkURLParameters();
});
