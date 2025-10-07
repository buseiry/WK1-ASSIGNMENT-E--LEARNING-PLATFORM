# Production Deployment Guide

This guide covers deploying the Reading Attendance Tracker to Firebase production.

## Prerequisites

1. Firebase project created and configured
2. Paystack account with API keys
3. Domain configured (optional)
4. All tests passing in emulator

## Step 1: Configure Paystack

### 1.1 Get Paystack Keys

1. Log into your Paystack dashboard
2. Go to Settings → API Keys & Webhooks
3. Copy your:
   - **Public Key** (starts with `pk_live_` for production)
   - **Secret Key** (starts with `sk_live_` for production)

### 1.2 Set Firebase Secret

```bash
firebase functions:secrets:set PAYSTACK_SECRET_KEY
# Enter your production Paystack secret key when prompted
```

## Step 2: Update Frontend Configuration

### 2.1 Update Paystack Public Key

Edit `public/payment.html` and update the Paystack public key:

```javascript
// Replace this line in payment.html
const PAYSTACK_PUBLIC_KEY = 'pk_live_your_actual_public_key_here';
```

### 2.2 Verify Firebase Configuration

Ensure all frontend files have the correct Firebase configuration:

```javascript
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.firebasestorage.app",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id",
    measurementId: "your-measurement-id"
};
```

## Step 3: Build and Deploy

### 3.1 Build Functions

```bash
cd functions
npm install
npm run build
cd ..
```

### 3.2 Deploy to Firebase

```bash
# Deploy everything
firebase deploy

# Or deploy specific services
firebase deploy --only functions
firebase deploy --only hosting
```

### 3.3 Verify Deployment

1. Check the hosting URL (usually `https://your-project.web.app`)
2. Test the complete user flow
3. Verify all functions are working
4. Check Firebase console for any errors

## Step 4: Configure Firestore Security Rules

### 4.1 Update Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read/write their own sessions
    match /sessions/{sessionId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Users can read/write their own payments
    match /payments/{paymentId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Anyone can read leaderboard data (users collection)
    match /users/{userId} {
      allow read: if true;
    }
    
    // Admin collections (restrict access)
    match /adminActions/{actionId} {
      allow read, write: if false; // Only accessible via admin scripts
    }
    
    match /error-logs/{logId} {
      allow read, write: if false; // Only accessible via admin scripts
    }
  }
}
```

### 4.2 Deploy Rules

```bash
firebase deploy --only firestore:rules
```

## Step 5: Configure Authentication

### 5.1 Enable Authentication Methods

1. Go to Firebase Console → Authentication → Sign-in method
2. Enable Email/Password authentication
3. Configure email verification if needed

### 5.2 Set Up Authorized Domains

1. Go to Authentication → Settings → Authorized domains
2. Add your production domain
3. Add `localhost` for testing

## Step 6: Set Up Monitoring

### 6.1 Enable Cloud Functions Logging

```bash
# View function logs
firebase functions:log

# View specific function logs
firebase functions:log --only startSession
```

### 6.2 Set Up Alerts

1. Go to Firebase Console → Functions
2. Set up alerts for function errors
3. Monitor function execution times

## Step 7: Configure Custom Domain (Optional)

### 7.1 Add Custom Domain

1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Follow the verification steps
4. Update DNS records as instructed

### 7.2 Update CORS Settings

If using a custom domain, update CORS settings in your functions if needed.

## Step 8: Production Testing

### 8.1 Test Complete Flow

1. **User Registration**:
   - Create new account
   - Verify email
   - Check user document created

2. **Payment Flow**:
   - Navigate to payment page
   - Complete payment with real card
   - Verify payment status updated

3. **Session Management**:
   - Start reading session
   - Test pause/resume functionality
   - Complete 60+ minute session
   - Verify points awarded

4. **Leaderboard**:
   - Check real-time updates
   - Verify monthly reset functionality

### 8.2 Load Testing

Test with multiple users:
- Create several test accounts
- Run concurrent sessions
- Monitor performance

## Step 9: Backup and Maintenance

### 9.1 Set Up Backups

```bash
# Export Firestore data
gcloud firestore export gs://your-backup-bucket/backup-$(date +%Y%m%d)
```

### 9.2 Monitor Performance

- Check function execution times
- Monitor Firestore usage
- Track user engagement metrics

## Step 10: Admin Operations

### 10.1 Deploy Admin Scripts

```bash
# Make scripts executable
chmod +x scripts/*.js

# Test admin functions
node scripts/list_active_sessions.js
```

### 10.2 Set Up Cron Jobs

For automated cleanup, set up cron jobs:

```bash
# Add to crontab
0 2 * * * cd /path/to/project && node scripts/cleanup_stuck_sessions.js --hours=24
```

## Troubleshooting

### Common Issues

1. **Functions timeout**:
   - Increase function timeout in `firebase.json`
   - Optimize function code

2. **Payment verification fails**:
   - Check Paystack webhook configuration
   - Verify secret key is correct

3. **Sessions not persisting**:
   - Check Firestore security rules
   - Verify user authentication

4. **Performance issues**:
   - Monitor function logs
   - Check Firestore indexes
   - Optimize queries

### Debug Commands

```bash
# Check function status
firebase functions:list

# View function details
firebase functions:describe startSession

# Check hosting status
firebase hosting:channel:list

# View deployment history
firebase hosting:releases:list
```

## Security Checklist

- [ ] Paystack secret key is set securely
- [ ] Firestore rules are properly configured
- [ ] Authentication is enabled and configured
- [ ] Admin scripts are secured
- [ ] Error logging is in place
- [ ] CORS is properly configured
- [ ] HTTPS is enforced
- [ ] Sensitive data is not exposed in frontend

## Performance Checklist

- [ ] Functions are optimized
- [ ] Firestore indexes are created
- [ ] Images are optimized
- [ ] CDN is configured
- [ ] Caching is implemented
- [ ] Database queries are efficient

## Monitoring Checklist

- [ ] Error tracking is enabled
- [ ] Performance monitoring is set up
- [ ] User analytics are configured
- [ ] Alerts are configured
- [ ] Logs are being collected
- [ ] Backup strategy is in place

## Post-Deployment

1. **Monitor for 24-48 hours**:
   - Check error logs
   - Monitor user activity
   - Verify all functions working

2. **Gather feedback**:
   - Monitor user behavior
   - Collect performance metrics
   - Address any issues quickly

3. **Plan updates**:
   - Schedule regular maintenance
   - Plan feature updates
   - Monitor user growth