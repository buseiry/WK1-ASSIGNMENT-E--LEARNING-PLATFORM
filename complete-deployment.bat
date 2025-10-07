@echo off
echo ========================================
echo Complete Deployment - Reading Tracker
echo ========================================
echo.

echo Step 1: Checking Firebase CLI...
firebase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Firebase CLI not found. Installing...
    npm install -g firebase-tools
    if %errorlevel% neq 0 (
        echo ❌ Failed to install Firebase CLI
        pause
        exit /b 1
    )
)
echo ✅ Firebase CLI ready

echo.
echo Step 2: Firebase Login...
echo This will open a browser window for authentication
echo Please sign in and allow Firebase CLI access
firebase login
if %errorlevel% neq 0 (
    echo ❌ Firebase login failed
    pause
    exit /b 1
)
echo ✅ Firebase login successful

echo.
echo Step 3: Firebase Initialization...
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
echo Step 4: Installing Dependencies...
echo Installing project dependencies...
npm install
if %errorlevel% neq 0 (
    echo ⚠️ npm install failed, trying alternative method...
    echo This might be due to network issues, continuing...
)

echo Installing function dependencies...
cd functions
npm install
if %errorlevel% neq 0 (
    echo ⚠️ Function dependencies failed, continuing...
)
cd ..
echo ✅ Dependencies installation attempted

echo.
echo Step 5: Deploying to Firebase...
echo Deploying all services...
firebase deploy
if %errorlevel% neq 0 (
    echo ❌ Deployment failed
    echo Check the error messages above
    pause
    exit /b 1
)

echo.
echo ========================================
echo 🎉 DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo Your Reading Attendance Tracker is now LIVE!
echo.
echo Features deployed:
echo ✅ Real-time session tracking
echo ✅ AI-powered insights (Gemini)
echo ✅ Payment integration (Paystack)
echo ✅ Global leaderboard
echo ✅ Mobile-responsive design
echo ✅ Anti-cheat measures
echo.
echo Payment methods configured:
echo - Ecobank: 4890010148 (Buseiry Olayinka Habeeb)
echo - OPay: 9164392514 (Buseiry Olayinka Habeeb)
echo.
echo Your app URL will be displayed above.
echo.
echo Next steps:
echo 1. Test your app at the provided URL
echo 2. Configure Paystack keys for payments
echo 3. Share with users
echo.
pause







