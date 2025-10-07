@echo off
echo ========================================
echo Gemini API Key Configuration
echo ========================================
echo.

echo Please enter your Gemini API Key:
echo (It should start with AIzaSy...)
set /p GEMINI_KEY="Enter your Gemini API Key: "

if "%GEMINI_KEY%"=="" (
    echo ❌ No API key entered. Please try again.
    pause
    exit /b 1
)

echo.
echo ✅ API Key received: %GEMINI_KEY:~0,10%...
echo.

echo Updating configuration files...

REM Update gemini-config.js
powershell -Command "(Get-Content 'gemini-config.js') -replace 'YOUR_GEMINI_API_KEY', '%GEMINI_KEY%' | Set-Content 'gemini-config.js'"

REM Update index.html
powershell -Command "(Get-Content 'index.html') -replace 'YOUR_GEMINI_API_KEY', '%GEMINI_KEY%' | Set-Content 'index.html'"

echo ✅ Configuration files updated successfully!
echo.

echo ========================================
echo 🎉 Gemini Configuration Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Run: firebase login
echo 2. Run: firebase init
echo 3. Run: firebase deploy
echo.
echo Check SETUP_GUIDE.md for detailed instructions.
echo.
pause







