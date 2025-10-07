// Admin script to upsert the owner account, set password, and mark paid
// Usage: node scripts/set_owner.cjs

const admin = require('firebase-admin');
const path = require('path');

async function main() {
  const serviceAccountPath = path.resolve(__dirname, '..', 'serviceAccountKey.json');
  try {
    admin.initializeApp({
      credential: admin.credential.cert(require(serviceAccountPath)),
    });
  } catch (e) {
    console.error('Failed to initialize admin SDK. Ensure serviceAccountKey.json exists at project root.', e);
    process.exit(1);
  }

  const auth = admin.auth();
  const db = admin.firestore();

  const ownerEmail = process.env.OWNER_EMAIL || 'buseiryhh4@gmail.com';
  const ownerPassword = process.env.OWNER_PASSWORD || 'BuseiryHola.0.4';

  try {
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(ownerEmail);
      // Update password and verify email
      userRecord = await auth.updateUser(userRecord.uid, {
        password: ownerPassword,
        emailVerified: true,
        disabled: false,
      });
      console.log(`Updated owner user ${ownerEmail} (uid=${userRecord.uid})`);
    } catch (err) {
      if (err && err.code === 'auth/user-not-found') {
        userRecord = await auth.createUser({
          email: ownerEmail,
          password: ownerPassword,
          emailVerified: true,
          disabled: false,
        });
        console.log(`Created owner user ${ownerEmail} (uid=${userRecord.uid})`);
      } else {
        throw err;
      }
    }

    const uid = userRecord.uid;
    await db.collection('users').doc(uid).set(
      {
        email: ownerEmail,
        hasPaid: true,
        paymentStatus: true,
        activeSession: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    console.log('Marked owner as paid in Firestore.');

    // Optional: ensure a session doc exists and is in a clean state
    await db.collection('sessions').doc(uid).set(
      {
        userId: uid,
        status: 'completed',
        active: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    console.log('Ensured session document exists for owner.');

    console.log('Owner setup complete.');
    process.exit(0);
  } catch (e) {
    console.error('Owner setup failed:', e);
    process.exit(1);
  }
}

main();

