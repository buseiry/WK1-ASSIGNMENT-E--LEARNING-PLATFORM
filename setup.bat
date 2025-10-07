@echo off
echo ========================================
echo Reading Attendance Tracker - Setup
echo ========================================
echo.

echo Checking if Node.js is installed...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js is installed

echo.
echo Checking if Firebase CLI is installed...
firebase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing Firebase CLI...
    npm install -g firebase-tools
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install Firebase CLI
        pause
        exit /b 1
    )
)
echo ✅ Firebase CLI is ready

echo.
echo Installing project dependencies...
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo ✅ Dependencies installed

echo.
echo Installing Cloud Functions dependencies...
cd functions
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install function dependencies
    pause
    exit /b 1
)
cd ..
echo ✅ Function dependencies installed

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Create a Firebase project at https://console.firebase.google.com/
echo 2. Enable Authentication (Email/Password) and Firestore Database
echo 3. Copy your Firebase config from Project Settings
echo 4. Update firebase-config.js with your actual config
echo 5. Run: firebase login
echo 6. Run: firebase init
echo 7. Run: firebase deploy
echo.
echo For testing, you can open:
echo - test.html (working demo interface)
echo - demo.html (feature overview)
echo.
echo Check README.md for detailed instructions!
echo.
pause







