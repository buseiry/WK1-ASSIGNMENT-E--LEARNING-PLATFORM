@echo off
echo ========================================
echo Quick Deploy - Reading Tracker
echo ========================================
echo.

echo Step 1: Firebase Login
echo Please answer Y when asked about Gemini features
firebase login

echo.
echo Step 2: Firebase Init
echo Please select:
echo - Use existing project: Yes
echo - Select your project
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
echo Step 3: Deploy
firebase deploy

echo.
echo ========================================
echo 🎉 DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo Your app is now live!
echo Check the URL above.
echo.
pause







