# Reading Attendance Tracker - Setup Script
# PowerShell version for Windows

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Reading Attendance Tracker - Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking if Node.js is installed..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Firebase CLI is installed
Write-Host ""
Write-Host "Checking if Firebase CLI is installed..." -ForegroundColor Yellow
try {
    $firebaseVersion = firebase --version
    Write-Host "✅ Firebase CLI is installed: $firebaseVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Installing Firebase CLI..." -ForegroundColor Yellow
    try {
        npm install -g firebase-tools
        Write-Host "✅ Firebase CLI installed successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ ERROR: Failed to install Firebase CLI" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Install project dependencies
Write-Host ""
Write-Host "Installing project dependencies..." -ForegroundColor Yellow
try {
    npm install
    Write-Host "✅ Project dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Failed to install dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Install Cloud Functions dependencies
Write-Host ""
Write-Host "Installing Cloud Functions dependencies..." -ForegroundColor Yellow
try {
    Set-Location functions
    npm install
    Set-Location ..
    Write-Host "✅ Function dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Failed to install function dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Create a Firebase project at https://console.firebase.google.com/" -ForegroundColor White
Write-Host "2. Enable Authentication (Email/Password) and Firestore Database" -ForegroundColor White
Write-Host "3. Copy your Firebase config from Project Settings" -ForegroundColor White
Write-Host "4. Update firebase-config.js with your actual config" -ForegroundColor White
Write-Host "5. Run: firebase login" -ForegroundColor White
Write-Host "6. Run: firebase init" -ForegroundColor White
Write-Host "7. Run: firebase deploy" -ForegroundColor White
Write-Host ""
Write-Host "For testing, you can open:" -ForegroundColor Yellow
Write-Host "- test.html (working demo interface)" -ForegroundColor White
Write-Host "- demo.html (feature overview)" -ForegroundColor White
Write-Host ""
Write-Host "Check README.md for detailed instructions!" -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to continue"







