# Session Management System - Installation Guide

## Overview

This guide provides step-by-step instructions for deploying the atomic session management system with race condition protection, admin controls, and comprehensive cleanup functionality.

## Prerequisites

- Node.js 16+ installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- Firebase project created
- Service account key downloaded

## Quick Deployment

### 1. Deploy Firestore Rules and Indexes

```bash
# Deploy rules and indexes
firebase deploy --only firestore

# Verify deployment
firebase firestore:rules:get
firebase firestore:indexes
```

### 2. Deploy Cloud Functions

```bash
# Install dependencies
cd functions
npm install

# Deploy functions
firebase deploy --only functions

# Verify deployment
firebase functions:list
```

### 3. Deploy Hosting

```bash
# Deploy static files
firebase deploy --only hosting

# Verify deployment
firebase hosting:channel:list
```

## Complete Deployment Command

```bash
# Deploy everything at once
firebase deploy --only firestore,functions,hosting
```

## Admin Setup

### Grant Admin Role

Create a script to grant admin privileges:

```javascript
// scripts/grant-admin.js
const admin = require('firebase-admin');

// Initialize with service account
const serviceAccount = require('./path/to/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function grantAdminRole(userEmail) {
  try {
    const user = await admin.auth().getUserByEmail(userEmail);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log(`✅ Admin role granted to ${userEmail}`);
  } catch (error) {
    console.error('❌ Failed to grant admin role:', error);
  }
}

// Usage
grantAdminRole('admin@yourdomain.com');
```

Run the script:
```bash
node scripts/grant-admin.js
```

### Revoke Admin Role

```javascript
// scripts/revoke-admin.js
async function revokeAdminRole(userEmail) {
  try {
    const user = await admin.auth().getUserByEmail(userEmail);
    await admin.auth().setCustomUserClaims(user.uid, { admin: false });
    console.log(`✅ Admin role revoked from ${userEmail}`);
  } catch (error) {
    console.error('❌ Failed to revoke admin role:', error);
  }
}
```

## Cleanup Script Usage

### Local Cleanup Script

```bash
# Basic cleanup (24 hour threshold)
node scripts/cleanup_stuck_sessions.js

# Custom threshold
node scripts/cleanup_stuck_sessions.js --threshold-hours=12

# Dry run (no changes)
node scripts/cleanup_stuck_sessions.js --dry-run

# Custom project
node scripts/cleanup_stuck_sessions.js --project-id=your-project-id
```

### Environment Variables

```bash
# Set service account path
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"

# Set project ID
export FIREBASE_PROJECT_ID="your-project-id"
```

### Cloud Function Cleanup

The cleanup function runs automatically every hour. You can also trigger it manually:

```javascript
// From admin panel or client
const cleanupFunction = firebase.functions().httpsCallable('manualCleanupStuckSessions');
const result = await cleanupFunction({ thresholdHours: 24 });
console.log(result.data);
```

## Testing

### Run Test Suite

1. Open `session-test-suite.html` in browser
2. Sign in with test user
3. Run all test categories:
   - Authentication Tests
   - Atomic Session Tests
   - Offline Support Tests
   - Admin Control Tests

### Manual Testing Steps

1. **Session Start Test**:
   - Sign in as paid user
   - Click "Start Session"
   - Verify session appears in admin panel

2. **Race Condition Test**:
   - Open multiple tabs
   - Try to start sessions simultaneously
   - Verify only one session starts

3. **Pause/Resume Test**:
   - Start session
   - Pause session
   - Resume session
   - Verify time tracking accuracy

4. **Admin Force End Test**:
   - Start session as user
   - Sign in as admin
   - Force end session from admin panel
   - Verify session ended

5. **Offline Test**:
   - Start session
   - Disconnect internet
   - Pause/resume session
   - Reconnect internet
   - Verify sync

## Verification Commands

### Check Firestore Rules

```bash
firebase firestore:rules:get
```

### Check Indexes

```bash
firebase firestore:indexes
```

### Check Functions

```bash
firebase functions:list
```

### Check Hosting

```bash
firebase hosting:channel:list
```

## Rollback Instructions

### Rollback Firestore Rules

```bash
# Restore previous rules
firebase firestore:rules:set firestore.rules.backup

# Or reset to default
firebase firestore:rules:set firestore-simple.rules
```

### Rollback Functions

```bash
# Deploy previous version
firebase deploy --only functions --project=your-project-id
```

### Rollback Hosting

```bash
# Deploy previous version
firebase deploy --only hosting --project=your-project-id
```

## Troubleshooting

### Common Issues

1. **"User already has an active session" error**:
   - Run cleanup script: `node scripts/cleanup_stuck_sessions.js`
   - Check admin panel for stuck sessions

2. **Permission denied errors**:
   - Verify user has admin role
   - Check Firestore rules deployment

3. **Index errors**:
   - Deploy indexes: `firebase deploy --only firestore:indexes`
   - Wait for index creation to complete

4. **Function timeout errors**:
   - Increase function timeout in `firebase.json`
   - Check function logs: `firebase functions:log`

### Debug Mode

Enable debug logging:

```javascript
// In browser console
localStorage.setItem('debug', 'true');
```

### Logs

Check logs for different components:

```bash
# Function logs
firebase functions:log

# Firestore logs
firebase firestore:logs

# Hosting logs
firebase hosting:logs
```

## Security Checklist

- [ ] Service account key secured
- [ ] Admin roles properly assigned
- [ ] Firestore rules deployed
- [ ] Payment verification working
- [ ] Session cleanup scheduled
- [ ] Error logging enabled
- [ ] Admin actions logged

## Performance Monitoring

### Key Metrics

- Session start success rate
- Average session duration
- Cleanup script execution time
- Admin action frequency
- Error rate by function

### Monitoring Setup

```javascript
// Add to functions
const monitoring = require('@google-cloud/monitoring');
const client = new monitoring.MetricServiceClient();

// Log custom metrics
await client.createTimeSeries({
  name: client.projectPath(process.env.GCLOUD_PROJECT),
  timeSeries: [{
    metric: {
      type: 'custom.googleapis.com/sessions/started',
      labels: { status: 'success' }
    },
    points: [{
      interval: { endTime: { seconds: Date.now() / 1000 } },
      value: { int64Value: 1 }
    }]
  }]
});
```

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review Firebase console logs
3. Run the test suite
4. Check admin panel for stuck sessions
5. Contact system administrator

## Version History

- v1.0: Initial atomic session management
- v1.1: Added cleanup scripts and admin controls
- v1.2: Enhanced error handling and offline support
- v1.3: Comprehensive test suite and monitoring
















