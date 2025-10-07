@echo off
echo ========================================
echo Firebase Configuration Update
echo ========================================
echo.

echo Please enter your Firebase project configuration:
echo.

set /p FIREBASE_API_KEY="Enter API Key: "
set /p FIREBASE_AUTH_DOMAIN="Enter Auth Domain: "
set /p FIREBASE_PROJECT_ID="Enter Project ID: "
set /p FIREBASE_STORAGE_BUCKET="Enter Storage Bucket: "
set /p FIREBASE_MESSAGING_SENDER_ID="Enter Messaging Sender ID: "
set /p FIREBASE_APP_ID="Enter App ID: "

echo.
echo ✅ Configuration received!
echo.

echo Updating firebase-config.js...

REM Create new firebase-config.js with actual values
(
echo // Firebase Configuration
echo // Your actual Firebase project configuration
echo const firebaseConfig = {
echo     apiKey: "%FIREBASE_API_KEY%",
echo     authDomain: "%FIREBASE_AUTH_DOMAIN%",
echo     projectId: "%FIREBASE_PROJECT_ID%",
echo     storageBucket: "%FIREBASE_STORAGE_BUCKET%",
echo     messagingSenderId: "%FIREBASE_MESSAGING_SENDER_ID%",
echo     appId: "%FIREBASE_APP_ID%"
echo };
echo.
echo // Initialize Firebase
echo firebase.initializeApp^(firebaseConfig^);
echo.
echo // Initialize Firebase services
echo const auth = firebase.auth^(^);
echo const db = firebase.firestore^(^);
echo const functions = firebase.functions^(^);
echo.
echo // Enable offline persistence
echo db.enablePersistence^(^).catch^((err^) =^> {
echo     if ^(err.code === 'failed-precondition'^) {
echo         console.log^('Multiple tabs open, persistence can only be enabled in one tab at a time.'^);
echo     } else if ^(err.code === 'unimplemented'^) {
echo         console.log^('The current browser does not support all features required for persistence'^);
echo     }
echo }^);
echo.
echo // Export for use in other modules
echo window.firebaseAuth = auth;
echo window.firebaseDb = db;
echo window.firebaseFunctions = functions;
) > firebase-config.js

echo Updating .firebaserc...

REM Create new .firebaserc with actual project ID
(
echo {
echo   "projects": {
echo     "default": "%FIREBASE_PROJECT_ID%"
echo   }
echo }
) > .firebaserc

echo.
echo ========================================
echo 🎉 Configuration Updated Successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Run: firebase login
echo 2. Run: firebase init
echo 3. Run: firebase deploy
echo.
echo Your app will be live at: https://%FIREBASE_PROJECT_ID%.web.app
echo.
pause







