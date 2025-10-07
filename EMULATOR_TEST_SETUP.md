# Emulator Test Setup Guide

This guide will help you set up and test the Reading Attendance Tracker application using Firebase emulators.

## Prerequisites

1. Node.js 18+ installed
2. Firebase CLI installed (`npm install -g firebase-tools`)
3. Firebase project configured

## Setup Steps

### 1. Install Dependencies

```bash
# Install functions dependencies
cd functions
npm install
cd ..

# Install root dependencies (if any)
npm install
```

### 2. Build Functions

```bash
cd functions
npm run build
cd ..
```

### 3. Configure Firebase

Make sure your `firebase.json` is properly configured:

```json
{
  "functions": {
    "source": "functions",
    "predeploy": ["npm --prefix \"$RESOURCE_DIR\" run build"]
  },
  "hosting": {
    "public": "public",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ]
  },
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "functions": {
      "port": 5001
    },
    "hosting": {
      "port": 5000
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

### 4. Set Up Paystack Secret (for testing)

```bash
# Set a test Paystack secret key
firebase functions:secrets:set PAYSTACK_SECRET_KEY
# Enter: sk_test_your_test_secret_key_here
```

### 5. Start Emulators

```bash
firebase emulators:start --only "auth,firestore,functions,hosting"
```

The emulators will start on:
- **Hosting**: http://localhost:5000
- **Functions**: http://localhost:5001
- **Firestore**: http://localhost:8080
- **Auth**: http://localhost:9099
- **Emulator UI**: http://localhost:4000

## Testing Workflow

### 1. User Registration/Login

1. Open http://localhost:5000
2. Navigate to the auth test page
3. Create a test user account
4. Verify email (if required)

### 2. Payment Flow

1. After login, you should be redirected to the About page
2. Click "Continue to Payment"
3. Test the Paystack payment flow (use test cards)
4. Verify payment completion

### 3. Session Management

1. After successful payment, access the Dashboard
2. Test session lifecycle:
   - Start session
   - Pause session
   - Resume session
   - End session
3. Verify timer persistence across page reloads
4. Check points are awarded for 60+ minute sessions

### 4. Leaderboard

1. Complete multiple sessions
2. Check leaderboard updates
3. Verify monthly reset functionality

## Test Data

### Test Paystack Cards

Use these test card numbers for payment testing:

- **Success**: 4084084084084081
- **Insufficient Funds**: 4084084084084085
- **Invalid Card**: 4084084084084086

### Test Scenarios

1. **New User Flow**:
   - Register → About → Payment → Dashboard

2. **Session Lifecycle**:
   - Start → Pause → Resume → End (60+ min)
   - Start → End (< 60 min, no points)

3. **Error Handling**:
   - Payment failure
   - Session conflicts
   - Network disconnection

4. **Admin Functions**:
   - List active sessions
   - Force end sessions
   - Cleanup stuck sessions

## Admin Script Testing

### List Active Sessions

```bash
node scripts/list_active_sessions.js --detailed
```

### Force End Session

```bash
node scripts/force_end_session.js <sessionId> "test_reason"
```

### Cleanup Stuck Sessions

```bash
# Dry run first
node scripts/cleanup_stuck_sessions.js --hours=1 --dry-run

# Actual cleanup
node scripts/cleanup_stuck_sessions.js --hours=1
```

## Troubleshooting

### Common Issues

1. **Functions not deploying**:
   - Check TypeScript compilation errors
   - Verify all dependencies are installed
   - Check Firebase configuration

2. **Payment not working**:
   - Verify Paystack secret key is set
   - Check Paystack public key in frontend
   - Ensure test mode is enabled

3. **Sessions not persisting**:
   - Check Firestore rules
   - Verify user authentication
   - Check browser localStorage

4. **Emulator connection issues**:
   - Restart emulators
   - Check port conflicts
   - Verify Firebase project ID

### Debug Commands

```bash
# Check emulator logs
firebase emulators:start --only functions --debug

# View Firestore data
# Open http://localhost:4000 and navigate to Firestore

# Check function logs
firebase functions:log --only functions
```

## Production Deployment

After successful testing:

1. **Deploy Functions**:
   ```bash
   firebase deploy --only functions
   ```

2. **Deploy Hosting**:
   ```bash
   firebase deploy --only hosting
   ```

3. **Set Production Secrets**:
   ```bash
   firebase functions:secrets:set PAYSTACK_SECRET_KEY
   # Enter your production Paystack secret key
   ```

4. **Update Frontend Config**:
   - Update Paystack public key in payment.html
   - Update Firebase config if needed

## Test Checklist

- [ ] User registration/login works
- [ ] About page displays correctly
- [ ] Payment flow completes successfully
- [ ] Dashboard loads after payment
- [ ] Session start/pause/resume/end works
- [ ] Timer persists across page reloads
- [ ] Points are awarded for 60+ minute sessions
- [ ] Leaderboard updates in real-time
- [ ] Admin scripts work correctly
- [ ] Error handling works properly
- [ ] Mobile responsiveness works
- [ ] All Firebase functions deploy successfully








