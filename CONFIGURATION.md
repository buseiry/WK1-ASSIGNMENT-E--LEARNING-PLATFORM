# Configuration Guide

This guide helps you configure the Reading Attendance Tracker application for your environment.

## Firebase Configuration

### 1. Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable the following services:
   - Authentication (Email/Password)
   - Firestore Database
   - Cloud Functions
   - Hosting

### 2. Get Configuration Values

1. Go to Project Settings > General
2. Scroll down to "Your apps" section
3. Click "Add app" > Web app
4. Copy the configuration object

### 3. Update firebase-config.js

Replace the placeholder values in `firebase-config.js`:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyC...", // Your actual API key
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef..."
};
```

### 4. Update .firebaserc

```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

## Paystack Configuration

### 1. Account Setup

1. Sign up at [Paystack](https://paystack.com/)
2. Complete account verification
3. Get your API keys from Settings > API Keys

### 2. Update Payment Configuration

In `payment.js`, update the public key:

```javascript
const handler = PaystackPop.setup({
    key: 'pk_live_your_actual_public_key', // Use live key for production
    // ... rest of configuration
});
```

### 3. Configure Cloud Functions

Set the secret key in Firebase Functions config:

```bash
firebase functions:config:set paystack.public_key="pk_live_your_public_key"
firebase functions:config:set paystack.secret_key="sk_live_your_secret_key"
```

### 4. Webhook Configuration

1. In Paystack dashboard, go to Settings > Webhooks
2. Add webhook URL: `https://your-region-your-project-id.cloudfunctions.net/paystackWebhook`
3. Select events: `charge.success`

## Environment-Specific Configuration

### Development Environment

For local development with Firebase emulators:

```bash
# Start emulators
firebase emulators:start

# The app will automatically use emulator endpoints
```

### Production Environment

1. **Firebase Hosting**:
   ```bash
   firebase deploy --only hosting
   ```

2. **Cloud Functions**:
   ```bash
   firebase deploy --only functions
   ```

3. **Firestore Rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Security Configuration

### 1. Firestore Security Rules

The `firestore.rules` file contains security rules. Key points:

- Users can only read/write their own data
- Only Cloud Functions can update points
- Payment records are write-protected
- Admin users have special permissions

### 2. Authentication Settings

In Firebase Console > Authentication > Settings:

1. **Authorized domains**: Add your production domain
2. **Email templates**: Customize verification emails
3. **Sign-in method**: Ensure Email/Password is enabled

### 3. CORS Configuration

For production, update CORS settings in Cloud Functions if needed.

## Testing Configuration

### 1. Test Users

Create test accounts for development:

1. Register with test email
2. Verify email (check Firebase Console > Authentication)
3. Test payment flow with Paystack test cards

### 2. Test Payment Cards

Use Paystack test cards:

- **Success**: 4084084084084081
- **Declined**: 4084084084084085
- **Insufficient funds**: 4084084084084082

### 3. Session Testing

For development, modify session duration in `functions/src/index.ts`:

```typescript
// Change 60 to 1 for 1-minute testing
if (durationMinutes >= 1) {
```

## Monitoring and Logs

### 1. Firebase Console

Monitor:
- Authentication users
- Firestore usage
- Cloud Functions logs
- Hosting analytics

### 2. Paystack Dashboard

Monitor:
- Transaction logs
- Webhook deliveries
- Payment analytics

### 3. Error Tracking

Check browser console and Firebase Functions logs for errors.

## Troubleshooting

### Common Configuration Issues

1. **CORS Errors**:
   - Check Firebase project configuration
   - Verify authorized domains

2. **Payment Failures**:
   - Verify Paystack keys
   - Check webhook configuration
   - Ensure HTTPS in production

3. **Authentication Issues**:
   - Check email verification settings
   - Verify Firestore rules
   - Check browser console for errors

### Debug Mode

Enable debug logging:

```javascript
// Add to firebase-config.js
firebase.firestore().settings({
  cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});
```

## Production Checklist

Before deploying to production:

- [ ] Update Firebase configuration with production project
- [ ] Use live Paystack keys
- [ ] Configure custom domain in Firebase Hosting
- [ ] Set up monitoring and alerts
- [ ] Test payment flow with real cards
- [ ] Verify email templates
- [ ] Check Firestore security rules
- [ ] Test session completion flow
- [ ] Verify leaderboard updates
- [ ] Check mobile responsiveness

## Support

For configuration issues:

1. Check Firebase documentation
2. Review Paystack integration docs
3. Check browser console for errors
4. Review Cloud Functions logs
5. Open an issue on GitHub







