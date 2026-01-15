// ============================================
// ADMIN AUTHENTICATION
// ============================================

// Check if user is logged in
function checkAuth() {
    return new Promise((resolve, reject) => {
        auth.onAuthStateChanged(user => {
            if (user) {
                resolve(user);
            } else {
                // Redirect to login if not on login page
                if (!window.location.pathname.includes('login.html')) {
                    window.location.href = 'login.html';
                }
                reject('Not authenticated');
            }
        });
    });
}

// Login function
async function login(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        return userCredential.user;
    } catch (error) {
        throw error;
    }
}

// Logout function
async function logout() {
    try {
        await auth.signOut();
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
        alert('Failed to logout. Please try again.');
    }
}

// Make logout global
window.logout = logout;

// Toggle password visibility
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
}

window.togglePassword = togglePassword;

// Login page specific code
if (window.location.pathname.includes('login.html')) {
    
    // Check if already logged in
    auth.onAuthStateChanged(user => {
        if (user) {
            window.location.href = 'index.html';
        }
    });
    
    // Login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const remember = document.getElementById('remember').checked;
            
            const loginBtn = document.getElementById('loginBtn');
            const btnText = loginBtn.querySelector('.btn-text');
            const btnLoading = loginBtn.querySelector('.btn-loading');
            const errorMessage = document.getElementById('errorMessage');
            
            // Show loading state
            loginBtn.disabled = true;
            btnText.style.display = 'none';
            btnLoading.style.display = 'flex';
            errorMessage.style.display = 'none';
            
            try {
                // Set persistence
                const persistence = remember 
                    ? firebase.auth.Auth.Persistence.LOCAL 
                    : firebase.auth.Auth.Persistence.SESSION;
                
                await auth.setPersistence(persistence);
                await login(email, password);
                
                // Redirect to dashboard
                window.location.href = 'index.html';
                
            } catch (error) {
                console.error('Login error:', error);
                
                // Show error message
                let errorText = 'Invalid email or password';
                
                switch (error.code) {
                    case 'auth/user-not-found':
                        errorText = 'No account found with this email';
                        break;
                    case 'auth/wrong-password':
                        errorText = 'Incorrect password';
                        break;
                    case 'auth/invalid-email':
                        errorText = 'Invalid email address';
                        break;
                    case 'auth/too-many-requests':
                        errorText = 'Too many failed attempts. Please try again later.';
                        break;
                }
                
                errorMessage.querySelector('span').textContent = errorText;
                errorMessage.style.display = 'flex';
                
                // Reset button state
                loginBtn.disabled = false;
                btnText.style.display = 'inline';
                btnLoading.style.display = 'none';
            }
        });
    }
    
} else {
    // Admin pages - check authentication
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            const user = await checkAuth();
            
            // Update user info in header
            const userName = document.getElementById('userName');
            const userEmail = document.getElementById('userEmail');
            
            if (userName && user.displayName) {
                userName.textContent = user.displayName;
            }
            
            if (userEmail) {
                userEmail.textContent = user.email;
            }
            
            console.log('✅ Authenticated as:', user.email);
            
        } catch (error) {
            console.error('Authentication check failed:', error);
        }
    });
    
    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const adminSidebar = document.getElementById('adminSidebar');
    
    if (mobileMenuToggle && adminSidebar) {
        mobileMenuToggle.addEventListener('click', () => {
            adminSidebar.classList.toggle('active');
        });
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (!adminSidebar.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                adminSidebar.classList.remove('active');
            }
        });
    }
}