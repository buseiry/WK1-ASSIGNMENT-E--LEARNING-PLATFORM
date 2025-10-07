# Firebase Cloud Functions Setup

## Required Setup

### 1. Firebase Secrets Configuration

You must set up your Paystack secret key using Firebase Secrets:

```bash
firebase functions:secrets:set PAYSTACK_SECRET_KEY
```

When prompted, enter your actual Paystack secret key (e.g., `sk_test_...` or `sk_live_...`).

### 2. Deployment

After setting up secrets, deploy your functions:

```bash
npm run build
firebase deploy --only functions
```

## Dependencies

- Node.js 20
- Firebase Admin SDK (latest)
- Firebase Functions (latest)

## Functions

- `startSession` - Start a new reading session
- `completeSession` - Complete a reading session and award points
- `createPayment` - Create payment reference for Paystack
- `verifyPayment` - Verify payment with Paystack
- `paystackWebhook` - Handle Paystack webhook events
- `updateRanks` - Update user rankings (scheduled)
- `cleanupOldSessions` - Clean up old sessions (scheduled)
- `verifySession` - Manual session verification
- `cleanupStuckSessions` - Clean up stuck sessions (scheduled)
- `manualCleanupStuckSessions` - Manual cleanup of stuck sessions
- `getCleanupStats` - Get cleanup statistics















