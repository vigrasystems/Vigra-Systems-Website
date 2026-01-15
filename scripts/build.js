/**
 * Build Script for Vigra-Systems Website
 * 
 * This script generates the firebase-config.js file from environment variables.
 * It runs during Vercel's build phase to inject Firebase credentials securely.
 * 
 * Usage:
 *   - Local: Create a .env file with your Firebase credentials, then run `node scripts/build.js`
 *   - Vercel: Add environment variables in Vercel Dashboard, the build runs automatically
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env file for local development
function loadEnvFile() {
    const envPath = path.join(__dirname, '..', '.env');
    
    if (fs.existsSync(envPath)) {
        console.log('📄 Loading environment variables from .env file...');
        const envContent = fs.readFileSync(envPath, 'utf8');
        
        envContent.split('\n').forEach(line => {
            // Skip comments and empty lines
            if (line.trim().startsWith('#') || !line.trim()) return;
            
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                const value = valueParts.join('=').trim();
                if (!process.env[key.trim()]) {
                    process.env[key.trim()] = value;
                }
            }
        });
    } else {
        console.log('⚠️  No .env file found, using environment variables from system/Vercel');
    }
}

// Generate the firebase-config.js file
function generateFirebaseConfig() {
    const requiredEnvVars = [
        'FIREBASE_API_KEY',
        'FIREBASE_AUTH_DOMAIN',
        'FIREBASE_PROJECT_ID',
        'FIREBASE_STORAGE_BUCKET',
        'FIREBASE_MESSAGING_SENDER_ID',
        'FIREBASE_APP_ID'
    ];

    // Check for missing environment variables
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.error('❌ Missing required environment variables:');
        missingVars.forEach(varName => console.error(`   - ${varName}`));
        console.error('\n💡 For local development: Create a .env file with these variables');
        console.error('💡 For Vercel: Add these in Project Settings → Environment Variables');
        process.exit(1);
    }

    const configContent = `// ============================================
// FIREBASE CONFIGURATION
// ============================================
// AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
// This file is generated during the build process
// To modify Firebase config, update environment variables
// ============================================

(function() {
    console.log('🔄 Initializing Firebase...');
    
    // Check if Firebase SDK is loaded
    if (typeof firebase === 'undefined') {
        console.error('❌ CRITICAL: Firebase SDK not loaded!');
        console.error('Make sure these scripts are loaded BEFORE firebase-config.js:');
        console.error('- firebase-app-compat.js');
        console.error('- firebase-firestore-compat.js');
        console.error('- firebase-auth-compat.js');
        console.error('- firebase-storage-compat.js');
        alert('Firebase SDK failed to load. Check your internet connection and try refreshing the page.');
        return;
    }
    
    console.log('✅ Firebase SDK loaded (version: ' + firebase.SDK_VERSION + ')');
    
    // Firebase configuration (injected during build)
    const firebaseConfig = {
        apiKey: "${process.env.FIREBASE_API_KEY}",
        authDomain: "${process.env.FIREBASE_AUTH_DOMAIN}",
        projectId: "${process.env.FIREBASE_PROJECT_ID}",
        storageBucket: "${process.env.FIREBASE_STORAGE_BUCKET}",
        messagingSenderId: "${process.env.FIREBASE_MESSAGING_SENDER_ID}",
        appId: "${process.env.FIREBASE_APP_ID}"
    };
    
    // Validate configuration
    if (firebaseConfig.apiKey === "YOUR_API_KEY_HERE" || !firebaseConfig.apiKey) {
        console.error('❌ CRITICAL: Firebase configuration not set!');
        console.error('Environment variables may not be configured correctly.');
        alert('⚠️ Firebase configuration missing!\\n\\nPlease check your environment variables.');
        return;
    }
    
    try {
        // Check if already initialized
        if (firebase.apps && firebase.apps.length > 0) {
            console.log('✅ Firebase already initialized');
        } else {
            // Initialize Firebase
            firebase.initializeApp(firebaseConfig);
            console.log('✅ Firebase app initialized');
        }
        
        // Initialize Firestore
        let db = null;
        if (typeof firebase.firestore === 'function') {
            db = firebase.firestore();
            window.db = db;
            console.log('✅ Firestore initialized');
        } else {
            console.error('❌ firebase.firestore is not available. Is firebase-firestore-compat.js loaded?');
        }
        
        // Initialize Auth
        let auth = null;
        if (typeof firebase.auth === 'function') {
            auth = firebase.auth();
            window.auth = auth;
            console.log('✅ Auth initialized');
        } else {
            console.error('❌ firebase.auth is not available. Is firebase-auth-compat.js loaded?');
        }
        
        // Initialize Storage
        let storage = null;
        if (typeof firebase.storage === 'function') {
            storage = firebase.storage();
            window.storage = storage;
            console.log('✅ Storage initialized');
        } else {
            console.error('❌ firebase.storage is not available. Is firebase-storage-compat.js loaded?');
        }
        
        // Make Firebase globally available
        window.firebase = firebase;
        
        console.log('🎉 Firebase initialization complete!');
        console.log('Available services:', {
            firestore: !!db,
            auth: !!auth,
            storage: !!storage
        });
        
    } catch (error) {
        console.error('❌ Firebase initialization error:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });
        alert('Firebase initialization failed: ' + error.message);
    }
    
})();
`;

    const outputPath = path.join(__dirname, '..', 'js', 'firebase-config.js');
    fs.writeFileSync(outputPath, configContent, 'utf8');
    console.log('✅ Generated js/firebase-config.js');
}

// Main build process
function build() {
    console.log('');
    console.log('🚀 Vigra-Systems Build Script');
    console.log('================================');
    console.log('');
    
    // Step 1: Load environment variables
    loadEnvFile();
    
    // Step 2: Generate Firebase config
    generateFirebaseConfig();
    
    console.log('');
    console.log('✅ Build completed successfully!');
    console.log('');
}

// Run the build
build();
