@echo off
echo ========================================
echo Firebase Setup for Reading Tracker
echo ========================================
echo.

echo Step 1: Checking Firebase CLI...
firebase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing Firebase CLI...
    npm install -g firebase-tools
)
echo ✅ Firebase CLI ready

echo.
echo Step 2: Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

cd functions
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install function dependencies
    pause
    exit /b 1
)
cd ..
echo ✅ Dependencies installed

echo.
echo Step 3: Firebase Login...
echo This will open a browser window for authentication
firebase login
if %errorlevel% neq 0 (
    echo ❌ Firebase login failed
    pause
    exit /b 1
)
echo ✅ Firebase login successful

echo.
echo Step 4: Firebase Initialization...
echo Please select the following options when prompted:
echo - Use existing project: Yes
echo - Select your project from the list
echo - Public directory: . (current directory)
echo - Single-page app: Yes
echo - Overwrite index.html: No
echo - Functions language: TypeScript
echo - ESLint: Yes
echo - Install dependencies: Yes
echo.
pause
firebase init

echo.
echo Step 5: Deploying to Firebase...
firebase deploy
if %errorlevel% neq 0 (
    echo ❌ Deployment failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo 🎉 Setup Complete!
echo ========================================
echo.
echo Your app is now live! Check the URL above.
echo.
echo Next steps:
echo 1. Configure Paystack keys in Firebase Functions
echo 2. Test the application
echo 3. Share with users
echo.
echo Check SETUP_GUIDE.md for detailed instructions.
echo.
pause







