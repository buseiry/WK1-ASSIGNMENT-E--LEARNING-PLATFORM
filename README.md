# Reading Attendance Tracker

A real-time web application for tracking reading group attendance and points with anti-cheat measures and payment integration.

## Features

- **Real-time Session Tracking**: Track reading sessions with server-side timestamps
- **Anti-cheat System**: Prevents point inflation through disconnection monitoring
- **Payment Integration**: Paystack integration for Nigerian users (₦500 after first user)
- **Global Leaderboard**: Real-time ranking system with points
- **Responsive Design**: Mobile-first design that works on all devices
- **Email Verification**: Required email verification before account activation
- **Firebase Integration**: Secure authentication and real-time database

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Firebase Cloud Functions (Node.js)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Authentication
- **Payments**: Paystack API
- **Hosting**: Firebase Hosting

## Prerequisites

- Node.js LTS (v18 or higher)
- Firebase CLI
- Paystack account (for payments)
- Git

## Quick start

1. Install deps:
   - `npm install`
   - `cd functions && npm install`
2. Configure Firebase project and Emulators:
   - `firebase use <your-project>`
   - `firebase emulators:start`
3. Local dev (static frontend in `frontend/`):
   - Open `frontend/index.html` with Live Server (VS Code) or host via Firebase Hosting emulator.
4. Deploy:
   - `firebase deploy --only hosting,functions`

## Environment

Set runtime config:

```
firebase functions:config:set paystack.secret_key="<sk>" paystack.public_key="<pk>"
```

Optionally, set `TEST_SESSION_MINUTES=1` for faster dev sessions.

## Functions v2 additions

- `startSessionV2` callable: server-side session start with RTDB presence node and queued verification.
- `verifySessionV2` scheduled: verifies sessions by aggregating RTDB presence.
- `paystackWebhookV2` HTTP: verifies signature and marks payments verified.

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd reading-attendance-tracker

# Install dependencies
npm install

# Install Firebase CLI globally
npm install -g firebase-tools
```

### 2. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Authentication with Email/Password
4. Enable Firestore Database
5. Enable Cloud Functions
6. Get your project configuration

### 3. Configure Firebase

1. Update `firebase-config.js` with your project configuration:

```javascript
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};
```

2. Update `.firebaserc` with your project ID:

```json
{
  "projects": {
    "default": "your-firebase-project-id"
  }
}
```

### 4. Paystack Configuration

1. Sign up at [Paystack](https://paystack.com/)
2. Get your public and secret keys
3. Update `payment.js` with your public key:

```javascript
const handler = PaystackPop.setup({
    key: 'pk_live_your_paystack_public_key', // Use live key for production
    // ... rest of configuration
});
```

4. Set Cloud Functions configuration:

```bash
firebase functions:config:set paystack.public_key="pk_live_your_public_key"
firebase functions:config:set paystack.secret_key="sk_live_your_secret_key"
```

### 5. Deploy Cloud Functions

```bash
# Install function dependencies
cd functions
npm install
cd ..

# Deploy functions
firebase deploy --only functions
```

### 6. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### 7. Deploy to Hosting

```bash
firebase deploy --only hosting
```

## Local Development

### Run Firebase Emulators

```bash
# Start emulators for local development
firebase emulators:start
```

This will start:
- Authentication emulator on port 9099
- Firestore emulator on port 8080
- Functions emulator on port 5001
- Hosting emulator on port 5000

### Test the Application

1. Open http://localhost:5000
2. Register a test user
3. Verify email (check emulator UI)
4. Start a reading session
5. Test the 60-minute completion flow

## Project Structure

```
reading-attendance-tracker/
├── functions/                 # Cloud Functions
│   ├── src/
│   │   └── index.ts          # Main functions code
│   ├── package.json           # Functions dependencies
│   └── tsconfig.json         # TypeScript config
├── index.html                # Main HTML file
├── styles.css                # CSS styles
├── firebase-config.js        # Firebase configuration
├── auth.js                   # Authentication module
├── session.js                # Session management
├── leaderboard.js            # Leaderboard functionality
├── payment.js                # Payment integration
├── app.js                    # Main application logic
├── firebase.json             # Firebase configuration
├── .firebaserc               # Firebase project config
├── firestore.rules           # Firestore security rules
├── firestore.indexes.json    # Firestore indexes
└── README.md                 # This file
```

## Database Schema

### Users Collection
```javascript
{
  email: string,
  verified: boolean,
  points: number,
  rank: number,
  paymentStatus: boolean,
  paymentReference?: string,
  createdAt: timestamp,
  lastActive: timestamp
}
```

### Sessions Collection
```javascript
{
  userId: string,
  startAt: timestamp,
  endAt?: timestamp,
  completed: boolean,
  pointsAwarded: boolean,
  disconnected: boolean,
  durationMinutes?: number,
  createdAt: timestamp
}
```

### Payments Collection
```javascript
{
  userId: string,
  email: string,
  amount: number,
  currency: string,
  reference: string,
  status: string,
  provider: string,
  createdAt: timestamp,
  verifiedAt?: timestamp
}
```

## Security Features

1. **Server-side Timestamps**: All session times use Firebase server timestamps
2. **Connection Monitoring**: Tracks page visibility and network connectivity
3. **Atomic Transactions**: Points are awarded atomically to prevent cheating
4. **Email Verification**: Required before account activation
5. **Payment Verification**: Server-side payment verification with Paystack
6. **Firestore Rules**: Restrictive security rules prevent unauthorized access

## Testing

### Test User Flow

1. **First User (Free)**:
   - Register with email
   - Verify email
   - Start reading session
   - Complete 60 minutes to earn points

2. **Second User (Payment Required)**:
   - Register with email
   - Verify email
   - Pay ₦500 via Paystack
   - Start reading session

3. **Session Testing**:
   - Start session
   - Stay connected for 60 minutes
   - Verify points are awarded
   - Check leaderboard updates

### Simulate 60-Minute Session (Development)

For testing purposes, you can modify the session completion time in `functions/src/index.ts`:

```typescript
// Change this line for testing
if (durationMinutes >= 60) { // Change 60 to 1 for 1-minute testing
```

## Deployment

### Production Deployment

1. **Update Configuration**:
   - Use production Firebase project
   - Use live Paystack keys
   - Update domain in Firebase Auth settings

2. **Deploy**:
   ```bash
   firebase deploy
   ```

3. **Set up Custom Domain** (optional):
   ```bash
   firebase hosting:channel:deploy production
   ```

### CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    - name: Install dependencies
      run: npm install
    - name: Install Firebase CLI
      run: npm install -g firebase-tools
    - name: Deploy to Firebase
      run: firebase deploy --token ${{ secrets.FIREBASE_TOKEN }}
```

## Environment Variables

Set these in Firebase Functions config:

```bash
firebase functions:config:set paystack.public_key="your_public_key"
firebase functions:config:set paystack.secret_key="your_secret_key"
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**:
   - Check Firebase project configuration
   - Verify email verification is enabled
   - Check Firestore rules

2. **Payment Issues**:
   - Verify Paystack keys are correct
   - Check webhook URL configuration
   - Ensure HTTPS is enabled

3. **Session Not Completing**:
   - Check Cloud Functions logs
   - Verify Firestore permissions
   - Check server timestamp configuration

### Debug Mode

Enable debug logging in browser console:

```javascript
// Add to firebase-config.js
firebase.firestore().settings({
  cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support, please:
1. Check the troubleshooting section
2. Review Firebase documentation
3. Check Paystack integration docs
4. Open an issue on GitHub

## Changelog

### v1.0.0
- Initial release
- Real-time session tracking
- Payment integration
- Anti-cheat measures
- Responsive design
- Global leaderboard

---

**Note**: This application is designed for educational and personal use. Ensure compliance with local regulations for payment processing and data handling.


