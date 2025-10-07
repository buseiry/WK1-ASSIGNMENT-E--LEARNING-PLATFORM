// Firebase Configuration for Reading Attendance Tracker
// Connected to your real Firebase project

// Check if Firebase is available
if (typeof firebase === 'undefined') {
    console.error('Firebase SDK not loaded. Please check your internet connection.');
}

// Your actual Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyCMJzYUsmZsf8KBWXQD8yFCdaurd5dCauY",
    authDomain: "reading-streak.firebaseapp.com",
    projectId: "reading-streak",
    storageBucket: "reading-streak.appspot.com",
    messagingSenderId: "508966325542",
    appId: "1:508966325542:web:82da076dc762ecc00fc5e7"
};

// Initialization is handled in the main firebase-config.js in production

// Initialize Firebase services
const auth = window.firebaseAuth;
const db = window.firebaseDb;

// Enable offline persistence
db.enablePersistence().catch((err) => {
    if (err.code === 'failed-precondition') {
        console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
        console.log('The current browser does not support all features required for persistence.');
    }
});

// Export services for global access
window.firebaseAuth = auth;
window.firebaseDb = db;
window.firebaseFunctions = functions;

// Demo helpers only
