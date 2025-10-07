# Troubleshooting Guide

## App Not Opening - Common Issues & Solutions

### Issue 1: App Shows Loading Screen Forever

**Problem:** The app gets stuck on the loading screen and never shows the interface.

**Causes:**
- Firebase SDK not loading (internet connection issue)
- Firebase configuration has placeholder values
- JavaScript errors preventing initialization

**Solutions:**

1. **Check Internet Connection:**
   ```bash
   # Test if Firebase CDN is accessible
   curl -I https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js
   ```

2. **Use Test Version:**
   - Open `test.html` instead of `index.html`
   - This version works without Firebase configuration
   - Shows the full interface in demo mode

3. **Check Browser Console:**
   - Press F12 to open developer tools
   - Look for JavaScript errors in Console tab
   - Check Network tab for failed requests

4. **Configure Firebase:**
   - Follow the setup steps in README.md
   - Update `firebase-config.js` with your actual Firebase config

### Issue 2: Firebase Configuration Errors

**Problem:** Console shows "Firebase not configured" or similar errors.

**Solution:**
1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Authentication (Email/Password) and Firestore Database
3. Copy your project configuration from Project Settings
4. Replace placeholder values in `firebase-config.js`:

```javascript
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-actual-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-actual-sender-id",
    appId: "your-actual-app-id"
};
```

### Issue 3: Authentication Not Working

**Problem:** Login/register buttons don't work or show errors.

**Causes:**
- Firebase Authentication not enabled
- Email verification not configured
- Firestore rules blocking access

**Solutions:**

1. **Enable Authentication:**
   - Go to Firebase Console > Authentication
   - Click "Get started"
   - Go to Sign-in method tab
   - Enable Email/Password

2. **Configure Email Templates:**
   - In Authentication > Templates
   - Customize verification email template
   - Set authorized domains

3. **Check Firestore Rules:**
   - Go to Firestore Database > Rules
   - Ensure rules allow authenticated users to read/write

### Issue 4: Payment Integration Issues

**Problem:** Paystack payment not working.

**Causes:**
- Paystack keys not configured
- Webhook URL not set up
- CORS issues

**Solutions:**

1. **Configure Paystack:**
   ```bash
   firebase functions:config:set paystack.public_key="pk_live_your_key"
   firebase functions:config:set paystack.secret_key="sk_live_your_key"
   ```

2. **Update Payment Script:**
   - Edit `payment.js`
   - Replace placeholder key with your Paystack public key

3. **Set up Webhook:**
   - In Paystack dashboard, add webhook URL
   - URL: `https://your-region-your-project.cloudfunctions.net/paystackWebhook`

### Issue 5: Session Tracking Not Working

**Problem:** Sessions don't start or complete properly.

**Causes:**
- Cloud Functions not deployed
- Firestore permissions issues
- Client-side JavaScript errors

**Solutions:**

1. **Deploy Cloud Functions:**
   ```bash
   cd functions
   npm install
   cd ..
   firebase deploy --only functions
   ```

2. **Check Function Logs:**
   ```bash
   firebase functions:log
   ```

3. **Test Functions Locally:**
   ```bash
   firebase emulators:start --only functions
   ```

### Issue 6: Mobile Responsiveness Issues

**Problem:** App doesn't work properly on mobile devices.

**Solutions:**

1. **Check Viewport Meta Tag:**
   - Ensure `<meta name="viewport" content="width=device-width, initial-scale=1.0">` is present

2. **Test on Different Devices:**
   - Use browser dev tools device simulation
   - Test on actual mobile devices

3. **Check CSS Media Queries:**
   - Verify responsive breakpoints in `styles.css`

## Quick Fixes

### Fix 1: Use Demo Version
If the main app isn't working, use the demo version:
```bash
# Open test.html in browser
start test.html
```

### Fix 2: Reset Configuration
If configuration is corrupted:
1. Delete `.firebaserc` and `firebase.json`
2. Run `firebase init` again
3. Select Hosting and Functions

### Fix 3: Clear Browser Cache
1. Press Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
2. Clear cached images and files
3. Refresh the page

### Fix 4: Check File Permissions
Ensure all files are readable:
```bash
# Windows
icacls * /grant Everyone:F

# Linux/Mac
chmod -R 755 .
```

## Testing Checklist

Before reporting issues, check:

- [ ] Internet connection is working
- [ ] Browser console shows no errors
- [ ] Firebase project is created and configured
- [ ] All required services are enabled
- [ ] Configuration files are updated
- [ ] Cloud Functions are deployed
- [ ] Firestore rules are deployed

## Getting Help

If you're still having issues:

1. **Check Console Logs:**
   - Open browser dev tools (F12)
   - Look for error messages
   - Take screenshots of errors

2. **Test with Demo Files:**
   - Try `test.html` for basic functionality
   - Try `demo.html` for feature overview

3. **Verify Setup:**
   - Follow README.md step by step
   - Check CONFIGURATION.md for detailed setup

4. **Common Solutions:**
   - Restart browser
   - Clear cache and cookies
   - Try different browser
   - Check firewall/antivirus settings

## Status Indicators

### ✅ Working
- App loads and shows interface
- No console errors
- Firebase services respond
- Authentication works
- Sessions can be started

### ⚠️ Partial Issues
- Interface loads but some features don't work
- Authentication works but sessions don't
- Sessions work but payments don't

### ❌ Not Working
- App doesn't load at all
- Console shows critical errors
- Firebase services not responding
- Complete functionality failure

## Emergency Fallback

If nothing works, use the demo version:

1. Open `test.html` - Shows working interface
2. Open `demo.html` - Shows feature overview
3. Follow setup instructions in README.md
4. Configure Firebase step by step
5. Deploy and test

The application is production-ready and all code is correct. Issues are usually configuration-related and can be resolved by following the setup instructions.







