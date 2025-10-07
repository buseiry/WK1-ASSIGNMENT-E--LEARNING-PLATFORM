// Demo Firebase Configuration
// This version will show the UI even without proper Firebase setup

// Check if Firebase is available
if (typeof firebase === 'undefined') {
    console.error('Firebase SDK not loaded. Please check your internet connection.');
    // Create mock Firebase objects to prevent errors
    window.firebase = {
        initializeApp: () => {},
        auth: () => ({
            onAuthStateChanged: () => {},
            signInWithEmailAndPassword: () => Promise.reject(new Error('Firebase not configured')),
            createUserWithEmailAndPassword: () => Promise.reject(new Error('Firebase not configured')),
            signOut: () => Promise.resolve(),
            currentUser: null
        }),
        firestore: () => ({
            collection: () => ({
                doc: () => ({
                    get: () => Promise.resolve({ exists: false }),
                    set: () => Promise.resolve(),
                    update: () => Promise.resolve()
                }),
                add: () => Promise.resolve({ id: 'demo-id' }),
                where: () => ({
                    get: () => Promise.resolve({ empty: true, docs: [] })
                }),
                orderBy: () => ({
                    limit: () => ({
                        get: () => Promise.resolve({ empty: true, docs: [] })
                    })
                })
            }),
            FieldValue: {
                serverTimestamp: () => new Date(),
                increment: (val) => val
            },
            enablePersistence: () => Promise.resolve()
        }),
        functions: () => ({
            httpsCallable: () => () => Promise.resolve({ data: { success: false, error: 'Firebase not configured' } })
        })
    };
}

// Demo configuration (replace with your actual Firebase config)
const firebaseConfig = {
    apiKey: "demo-api-key",
    authDomain: "demo-project.firebaseapp.com",
    projectId: "demo-project",
    storageBucket: "demo-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "demo-app-id"
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Firebase initialization failed:', error);
    console.log('Running in demo mode - please configure Firebase for full functionality');
}

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const functions = firebase.functions();

// Enable offline persistence
db.enablePersistence().catch((err) => {
    if (err.code === 'failed-precondition') {
        console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
        console.log('The current browser does not support all features required for persistence');
    }
});

// Export for use in other modules
window.firebaseAuth = auth;
window.firebaseDb = db;
window.firebaseFunctions = functions;

// Show configuration notice
console.log(`
🚀 Reading Attendance Tracker - Demo Mode
==========================================

The app is running in demo mode because Firebase is not properly configured.

To enable full functionality:
1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Authentication (Email/Password) and Firestore Database
3. Copy your project configuration
4. Replace the config in firebase-config.js with your actual values
5. Deploy with: firebase deploy

Current features in demo mode:
✅ UI/UX - Full interface visible
✅ Responsive design - Works on all devices
⚠️ Authentication - Mock (not functional)
⚠️ Database - Mock (not functional)
⚠️ Payments - Mock (not functional)
⚠️ Real-time features - Mock (not functional)

Check README.md for complete setup instructions!
`);







