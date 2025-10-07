# 🚀 Firebase Setup Steps - Reading Attendance Tracker

## **Step 1: Create Firebase Project**

### **In Firebase Console (https://console.firebase.google.com/):**

1. **Click "Create a project" or "Add project"**
2. **Project name:** `reading-attendance-tracker` (or your preferred name)
3. **Google Analytics:** Optional (you can enable or disable)
4. **Click "Create project"**
5. **Wait for project creation to complete**

## **Step 2: Enable Required Services**

### **Authentication Setup:**
1. **Go to Authentication** → **Get started**
2. **Click "Sign-in method" tab**
3. **Enable "Email/Password"**
4. **Click "Save"**

### **Firestore Database Setup:**
1. **Go to Firestore Database** → **Create database**
2. **Choose "Start in test mode"** (we'll secure it later)
3. **Select a location** (choose closest to your users)
4. **Click "Done"**

### **Cloud Functions Setup:**
1. **Go to Functions** → **Get started**
2. **Click "Continue"** (this enables Cloud Functions)

### **Hosting Setup:**
1. **Go to Hosting** → **Get started**
2. **Click "Continue"** (this enables Firebase Hosting)

## **Step 3: Get Firebase Configuration**

1. **Go to Project Settings** (gear icon) → **General** tab
2. **Scroll to "Your apps" section**
3. **Click "Add app"** → **Web app** (</> icon)
4. **App nickname:** `reading-tracker-web`
5. **Click "Register app"**
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

## **Step 4: Update Configuration Files**

### **Update firebase-config.js:**
Replace the placeholder values with your actual Firebase config

### **Update .firebaserc:**
Replace `your-firebase-project-id` with your actual project ID

## **Step 5: Deploy Application**

Once configuration is updated, we'll deploy using Firebase CLI.

---

**Current Status:** ✅ Firebase Console opened
**Next:** Follow the steps above to create your project and get configuration







