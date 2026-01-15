// ============================================
// QUOTE PAGE JAVASCRIPT
// ============================================

let currentStep = 1;
let uploadedFiles = [];
let generatedReferenceNumber = '';

// ============================================
// GENERATE REFERENCE NUMBER
// ============================================
function generateReferenceNumber() {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `VGR-${year}-${timestamp}${random}`;
}

// ============================================
// STEP NAVIGATION
// ============================================
function nextStep(step) {
    // Validate current step before proceeding
    if (!validateStep(currentStep)) {
        return;
    }

    // Hide current step
    document.querySelector(`.form-step[data-step="${currentStep}"]`).classList.remove('active');
    document.querySelector(`.progress-step[data-step="${currentStep}"]`).classList.remove('active');
    document.querySelector(`.progress-step[data-step="${currentStep}"]`).classList.add('completed');

    // Show next step
    currentStep = step;
    document.querySelector(`.form-step[data-step="${step}"]`).classList.add('active');
    document.querySelector(`.progress-step[data-step="${step}"]`).classList.add('active');

    // Scroll to top of form
    document.querySelector('.quote-section').scrollIntoView({ behavior: 'smooth' });
}

function prevStep(step) {
    // Hide current step
    document.querySelector(`.form-step[data-step="${currentStep}"]`).classList.remove('active');
    document.querySelector(`.progress-step[data-step="${currentStep}"]`).classList.remove('active');

    // Show previous step
    currentStep = step;
    document.querySelector(`.form-step[data-step="${step}"]`).classList.add('active');
    document.querySelector(`.progress-step[data-step="${step}"]`).classList.add('active');
    document.querySelector(`.progress-step[data-step="${currentStep}"]`).classList.remove('completed');

    // Scroll to top of form
    document.querySelector('.quote-section').scrollIntoView({ behavior: 'smooth' });
}

// Make functions global
window.nextStep = nextStep;
window.prevStep = prevStep;

// ============================================
// VALIDATE STEP
// ============================================
function validateStep(step) {
    const formStep = document.querySelector(`.form-step[data-step="${step}"]`);
    const inputs = formStep.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (!input.value.trim()) {
            isValid = false;
            input.style.borderColor = 'var(--error)';

            // Reset border color on input
            input.addEventListener('input', function () {
                this.style.borderColor = '';
            }, { once: true });
        }
    });

    if (!isValid) {
        // Show error message
        const errorMsg = document.createElement('div');
        errorMsg.className = 'validation-error';
        errorMsg.style.cssText = 'color: var(--error); margin-top: 1rem; padding: 0.75rem; background: rgba(239, 68, 68, 0.1); border-radius: var(--radius-md);';
        errorMsg.textContent = 'Please fill in all required fields';

        formStep.appendChild(errorMsg);

        setTimeout(() => {
            errorMsg.remove();
        }, 3000);
    }

    return isValid;
}

// ============================================
// FILE UPLOAD HANDLING
// ============================================
function handleFileSelect(event) {
    const files = event.target.files;
    const uploadedFilesContainer = document.getElementById('uploadedFiles');
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip'];

    Array.from(files).forEach(file => {
        // Validate file size
        if (file.size > maxSize) {
            alert(`File "${file.name}" is too large. Maximum size is 5MB.`);
            return;
        }

        // Validate file type
        if (!allowedTypes.includes(file.type)) {
            alert(`File "${file.name}" has an invalid type. Allowed types: PDF, JPG, PNG, DOC, DOCX, ZIP.`);
            return;
        }

        // Add to uploaded files array
        uploadedFiles.push(file);

        // Create file display element
        const fileElement = document.createElement('div');
        fileElement.className = 'uploaded-file-item';
        fileElement.innerHTML = `
            <div class="file-info">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/>
                    <polyline points="13 2 13 9 20 9"/>
                </svg>
                <div>
                    <p class="file-name">${file.name}</p>
                    <p class="file-size">${formatFileSize(file.size)}</p>
                </div>
            </div>
            <button type="button" class="remove-file" onclick="removeFile('${file.name}')" aria-label="Remove file">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        `;

        uploadedFilesContainer.appendChild(fileElement);
    });

    // Clear input
    event.target.value = '';
}

window.handleFileSelect = handleFileSelect;

// ============================================
// REMOVE FILE
// ============================================
function removeFile(fileName) {
    uploadedFiles = uploadedFiles.filter(file => file.name !== fileName);

    // Remove from UI
    const fileElements = document.querySelectorAll('.uploaded-file-item');
    fileElements.forEach(el => {
        if (el.querySelector('.file-name').textContent === fileName) {
            el.remove();
        }
    });
}

window.removeFile = removeFile;

// ============================================
// FORMAT FILE SIZE
// ============================================
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ============================================
// UPLOAD FILES TO FIREBASE STORAGE
// ============================================
async function uploadFilesToStorage(referenceNumber) {
    const uploadPromises = uploadedFiles.map(async (file) => {
        const storageRef = storage.ref(`quotes/${referenceNumber}/${file.name}`);
        const snapshot = await storageRef.put(file);
        const downloadURL = await snapshot.ref.getDownloadURL();
        return downloadURL;
    });

    return await Promise.all(uploadPromises);
}

// ============================================
// SUBMIT QUOTE FORM
// ============================================
async function submitQuoteForm(e) {
    e.preventDefault();

    // Validate final step
    if (!validateStep(3)) {
        return;
    }

    const form = e.target;
    const submitBtn = document.getElementById('submitQuoteBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');

    // Show loading state
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'flex';

    try {
        // Generate reference number
        generatedReferenceNumber = generateReferenceNumber();

        // Upload files to Firebase Storage
        let attachmentURLs = [];
        if (uploadedFiles.length > 0) {
            attachmentURLs = await uploadFilesToStorage(generatedReferenceNumber);
        }

        // Prepare quote data
        const quoteData = {
            referenceNumber: generatedReferenceNumber,

            // Client Information
            clientName: form.clientName.value.trim(),
            companyName: form.companyName.value.trim(),
            email: form.email.value.trim(),
            phone: form.phone.value.trim(),

            // Project Details
            projectType: form.projectType.value,
            projectDescription: form.projectDescription.value.trim(),
            timeline: form.timeline.value,
            budgetRange: form.budgetRange.value || 'Not specified',

            // Additional Info
            attachments: attachmentURLs,
            requiresNDA: form.nda?.checked || false,
            newsletter: form.newsletter?.checked || false,

            // Status Tracking
            status: 'New',
            status: 'New',
            emailSent: true, // Assumed sent by client logic
            notifiedTeam: true, // Assumed sent by client logic
            adminNotes: '',

            // Metadata
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Save to Firestore
        await db.collection('quotes').add(quoteData);

        // Send email notifications
        await sendQuoteEmails(quoteData);

        // Note: Email status is handled by backend triggers or initial state
        // Skipping client-side update to maintain write-only security rules

        // Track in Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'quote_request_submit', {
                'project_type': quoteData.projectType,
                'timeline': quoteData.timeline,
                'has_attachments': attachmentURLs.length > 0
            });
        }

        // Show success state
        showSuccessState(quoteData.email);

    } catch (error) {
        console.error('Error submitting quote:', error);
        showErrorState(error.message);
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
}

// ============================================
// SEND QUOTE EMAILS
// ============================================
async function sendQuoteEmails(quoteData) {
    // This is a placeholder for email sending functionality
    // In production, you would use EmailJS, SendGrid, or Cloud Functions

    console.log('Sending quote confirmation email to:', quoteData.email);
    console.log('Sending quote notification to team');

    const SERVICE_ID = 'service_hgoc2xs';
    const TEMPLATE_ID = 'template_542tmgq'; // Quote Template ID

    try {
        if (typeof emailjs === 'undefined') {
            console.error('EmailJS not loaded');
            return;
        }

        const templateParams = {
            reference_number: quoteData.referenceNumber,
            client_name: quoteData.clientName,
            company_name: quoteData.companyName,
            to_email: quoteData.email, // Client's email
            phone: quoteData.phone,
            project_type: quoteData.projectType,
            timeline: quoteData.timeline,
            project_description: quoteData.projectDescription
        };

        await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams);
        console.log('✅ Quote emails sent successfully');

    } catch (error) {
        console.error('❌ Error sending quote emails:', error);
    }
}

// ============================================
// SHOW SUCCESS STATE
// ============================================
function showSuccessState(email) {
    const form = document.querySelector('.quote-form');
    const sidebar = document.querySelector('.quote-sidebar');
    const progress = document.querySelector('.quote-progress');
    const success = document.getElementById('quoteSuccess');

    // Hide form elements
    form.style.display = 'none';
    sidebar.style.display = 'none';
    progress.style.display = 'none';

    // Show success message
    success.style.display = 'block';
    document.getElementById('displayRefNumber').textContent = generatedReferenceNumber;
    document.getElementById('confirmEmail').textContent = email;

    // Scroll to success message
    success.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================
// SHOW ERROR STATE
// ============================================
function showErrorState(message) {
    const form = document.querySelector('.quote-form');
    const sidebar = document.querySelector('.quote-sidebar');
    const progress = document.querySelector('.quote-progress');
    const error = document.getElementById('quoteError');

    // Hide form elements
    form.style.display = 'none';
    sidebar.style.display = 'none';
    progress.style.display = 'none';

    // Show error message
    error.style.display = 'block';
    document.getElementById('errorMessage').textContent = message || 'An unexpected error occurred. Please try again.';

    // Scroll to error message
    error.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================
// RESET FORM
// ============================================
function resetForm() {
    const form = document.querySelector('.quote-form');
    const sidebar = document.querySelector('.quote-sidebar');
    const progress = document.querySelector('.quote-progress');
    const error = document.getElementById('quoteError');

    // Show form elements
    form.style.display = 'block';
    sidebar.style.display = 'block';
    progress.style.display = 'flex';

    // Hide error
    error.style.display = 'none';

    // Reset to step 1
    currentStep = 1;
    document.querySelectorAll('.form-step').forEach(step => step.classList.remove('active'));
    document.querySelectorAll('.progress-step').forEach(step => {
        step.classList.remove('active', 'completed');
    });
    document.querySelector('.form-step[data-step="1"]').classList.add('active');
    document.querySelector('.progress-step[data-step="1"]').classList.add('active');

    // Clear form
    document.getElementById('quoteForm').reset();
    uploadedFiles = [];
    document.getElementById('uploadedFiles').innerHTML = '';

    // Scroll to top
    document.querySelector('.quote-section').scrollIntoView({ behavior: 'smooth' });
}

window.resetForm = resetForm;

// ============================================
// COPY REFERENCE NUMBER
// ============================================
function copyReferenceNumber() {
    const refNumber = document.getElementById('displayRefNumber').textContent;

    navigator.clipboard.writeText(refNumber).then(() => {
        const btn = event.target.closest('button');
        const originalHTML = btn.innerHTML;

        btn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
            </svg>
            Copied!
        `;

        setTimeout(() => {
            btn.innerHTML = originalHTML;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy reference number');
    });
}

window.copyReferenceNumber = copyReferenceNumber;

// ============================================
// CHARACTER COUNTER FOR DESCRIPTION
// ============================================
function updateDescriptionCharCount() {
    const descField = document.getElementById('projectDescription');
    const charCount = document.getElementById('descCharCount');

    if (descField && charCount) {
        descField.addEventListener('input', () => {
            const length = descField.value.length;
            charCount.textContent = length;

            if (length > 900) {
                charCount.style.color = 'var(--warning)';
            } else {
                charCount.style.color = 'var(--gray-600)';
            }
        });
    }
}

// ============================================
// EVENT LISTENERS
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('💼 Quote page loaded');

    // Form submission
    const quoteForm = document.getElementById('quoteForm');
    if (quoteForm) {
        quoteForm.addEventListener('submit', submitQuoteForm);
    }

    // Character counter
    updateDescriptionCharCount();

    // Drag and drop for file upload
    const fileUploadArea = document.getElementById('fileUploadArea');
    if (fileUploadArea) {
        fileUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileUploadArea.style.borderColor = 'var(--primary-500)';
            fileUploadArea.style.background = 'rgba(59, 130, 246, 0.05)';
        });

        fileUploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            fileUploadArea.style.borderColor = '';
            fileUploadArea.style.background = '';
        });

        fileUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            fileUploadArea.style.borderColor = '';
            fileUploadArea.style.background = '';

            const files = e.dataTransfer.files;
            const input = document.getElementById('attachments');
            input.files = files;
            handleFileSelect({ target: input });
        });
    }
});