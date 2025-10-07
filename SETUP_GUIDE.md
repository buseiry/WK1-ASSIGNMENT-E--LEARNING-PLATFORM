# Complete Setup Guide for Reading Attendance Tracker

## 🚀 **Step-by-Step Firebase Setup**

### **Step 1: Create Firebase Project**

1. **Go to Firebase Console:**
   - Visit: https://console.firebase.google.com/
   - Click "Create a project" or "Add project"

2. **Project Setup:**
   - Project name: `reading-attendance-tracker` (or your preferred name)
   - Enable Google Analytics: Optional
   - Click "Create project"

### **Step 2: Enable Required Services**

#### **Authentication Setup:**
1. Go to **Authentication** > **Get started**
2. Click **Sign-in method** tab
3. Enable **Email/Password**
4. Click **Save**

#### **Firestore Database Setup:**
1. Go to **Firestore Database** > **Create database**
2. Choose **Start in test mode** (we'll secure it later)
3. Select a location (choose closest to your users)
4. Click **Done**

#### **Cloud Functions Setup:**
1. Go to **Functions** > **Get started**
2. Click **Continue** (this enables Cloud Functions)

### **Step 3: Get Firebase Configuration**

1. Go to **Project Settings** (gear icon) > **General** tab
2. Scroll to **"Your apps"** section
3. Click **"Add app"** > **Web app** (</> icon)
4. App nickname: `reading-tracker-web`
5. Click **Register app**
6. **Copy the configuration object** (it looks like this):

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef..."
};
```

### **Step 4: Update Configuration Files**

#### **Update firebase-config.js:**
Replace the placeholder values in `firebase-config.js` with your actual Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyC...", // Your actual API key
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id", // Your actual project ID
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789", // Your actual sender ID
    appId: "1:123456789:web:abcdef..." // Your actual app ID
};
```

#### **Update .firebaserc:**
Replace `your-firebase-project-id` with your actual project ID:

```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

### **Step 5: Deploy the Application**

#### **Install Dependencies:**
```bash
npm install
cd functions
npm install
cd ..
```

#### **Login to Firebase:**
```bash
firebase login
```
- This will open a browser window
- Sign in with your Google account
- Allow Firebase CLI access

#### **Initialize Firebase Project:**
```bash
firebase init
```

**Select the following options:**
- ✅ **Hosting** (for web app)
- ✅ **Functions** (for backend)
- ✅ **Firestore** (for database rules)

**Configuration:**
- Use existing project: **Yes**
- Select your project from the list
- Public directory: **.** (current directory)
- Single-page app: **Yes**
- Overwrite index.html: **No**
- Functions language: **TypeScript**
- ESLint: **Yes**
- Install dependencies: **Yes**

#### **Deploy Everything:**
```bash
firebase deploy
```

This will deploy:
- ✅ Web app to Firebase Hosting
- ✅ Cloud Functions
- ✅ Firestore security rules
- ✅ Firestore indexes

### **Step 6: Configure Gemini AI Features**

#### **Enable Gemini in Firebase:**
1. Go to Firebase Console > **Build** > **Extensions**
2. Search for "Gemini" or "Generative AI"
3. Install the Gemini extension if available
4. Or enable Gemini API in Google Cloud Console

#### **Get Gemini API Key:**
1. Go to https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click **Create API Key**
4. Copy the generated API key

#### **Update Gemini Configuration:**
1. **Update gemini-config.js:**
   Replace `YOUR_GEMINI_API_KEY` with your actual Gemini API key

2. **Update index.html:**
   Replace `YOUR_GEMINI_API_KEY` in the Gemini script tag

3. **Features Enabled:**
   - ✅ AI Reading Insights
   - ✅ Personalized Recommendations
   - ✅ Smart Session Analysis
   - ✅ Goal Suggestions

### **Step 7: Configure Payment (Paystack)**

#### **Get Paystack Keys:**
1. Sign up at https://paystack.com/
2. Go to **Settings** > **API Keys**
3. Copy your **Public Key** and **Secret Key**

#### **Update Payment Configuration:**
1. **Update payment.js:**
   Replace `pk_test_your_paystack_public_key` with your actual Paystack public key

2. **Set Cloud Functions Config:**
   ```bash
   firebase functions:config:set paystack.public_key="pk_live_your_public_key"
   firebase functions:config:set paystack.secret_key="sk_live_your_secret_key"
   ```

3. **Redeploy Functions:**
   ```bash
   firebase deploy --only functions
   ```

### **Step 8: Test the Application**

#### **Access Your App:**
- Your app will be available at: `https://your-project-id.web.app`
- Or check the Firebase Console > Hosting for the URL

#### **Test Features:**
1. **Registration:** Create a test account
2. **Email Verification:** Check email and verify
3. **Payment:** Test with Paystack test cards
4. **Session:** Start a reading session
5. **Leaderboard:** Check real-time updates

## 🎯 **Payment Methods Configured**

Your payment methods are already configured in the app:

### **Ecobank Account:**
- **Account Number:** 4890010148
- **Account Name:** Buseiry Olayinka Habeeb

### **OPay Account:**
- **Account Number:** 9164392514
- **Account Name:** Buseiry Olayinka Habeeb

These will be displayed to users during the payment process.

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **App shows loading screen forever:**
   - Check if Firebase config is correct
   - Verify internet connection
   - Check browser console for errors

2. **Authentication not working:**
   - Ensure Email/Password is enabled in Firebase Console
   - Check Firestore rules
   - Verify email verification settings

3. **Payment not working:**
   - Check Paystack keys are correct
   - Verify webhook URL is set
   - Check Cloud Functions logs

4. **Deployment fails:**
   - Ensure you're logged in: `firebase login`
   - Check project ID in `.firebaserc`
   - Verify all services are enabled

### **Quick Commands:**
```bash
# Check Firebase status
firebase projects:list

# View logs
firebase functions:log

# Redeploy specific services
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
```

## ✅ **Success Checklist**

- [ ] Firebase project created
- [ ] Authentication enabled (Email/Password)
- [ ] Firestore database created
- [ ] Cloud Functions enabled
- [ ] Firebase config updated
- [ ] Gemini AI features configured
- [ ] Gemini API key obtained and configured
- [ ] Project deployed successfully
- [ ] Paystack keys configured
- [ ] App accessible via URL
- [ ] Registration works
- [ ] Email verification works
- [ ] Payment process works
- [ ] Session tracking works
- [ ] Leaderboard updates
- [ ] AI Reading Insights working
- [ ] Personalized recommendations working
- [ ] Session analysis working

## 🎉 **You're Ready!**

Once all steps are completed, your Reading Attendance Tracker will be:
- ✅ **Live and accessible** via Firebase Hosting
- ✅ **Fully functional** with all features working
- ✅ **AI-powered** with Gemini integration for insights
- ✅ **Secure** with proper authentication and rules
- ✅ **Monetized** with your payment methods integrated
- ✅ **Real-time** with live leaderboard updates
- ✅ **Mobile-responsive** for all devices
- ✅ **Intelligent** with personalized recommendations

The application is production-ready and includes all requested features!
