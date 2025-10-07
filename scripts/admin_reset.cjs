// Admin cleanup script: delete specified users and reset stats for all users
// Usage: node scripts/admin_reset.cjs

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

  // Emails to purge completely
  const emailsToDelete = [
    'buseiryhh4@gmail.com',
    'buseiry.habeeb.olayinka@lasustech.edu.ng',
    'buseiryh4@gmail.com',
  ];

  // 1) Delete specified users and their Firestore data
  for (const email of emailsToDelete) {
    try {
      const userRecord = await auth.getUserByEmail(email);
      const uid = userRecord.uid;
      console.log(`Deleting user ${email} (uid=${uid})`);

      // Delete auth user
      await auth.deleteUser(uid);

      // Delete Firestore user doc
      await db.collection('users').doc(uid).delete().catch(() => {});

      // Delete session doc
      await db.collection('sessions').doc(uid).delete().catch(() => {});

      // Delete payments by userId or email
      const byUserId = await db.collection('payments').where('userId', '==', uid).get();
      const byEmail = await db.collection('payments').where('email', '==', email).get();

      const batch = db.batch();
      byUserId.forEach(doc => batch.delete(doc.ref));
      byEmail.forEach(doc => batch.delete(doc.ref));
      if (!byUserId.empty || !byEmail.empty) {
        await batch.commit();
      }

      console.log(`Deleted auth and data for ${email}`);
    } catch (err) {
      if (err && err.code === 'auth/user-not-found') {
        console.log(`Auth user not found for ${email}, cleaning Firestore only.`);
        // Clean Firestore payments by email
        const byEmail = await db.collection('payments').where('email', '==', email).get();
        if (!byEmail.empty) {
          const batch = db.batch();
          byEmail.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
        }
      } else {
        console.error(`Error processing ${email}:`, err);
      }
    }
  }

  // 2) Reset statistics for all users (start afresh)
  console.log('Resetting stats for all users (points, totalSessions, totalSessionTime) to 0');
  const usersSnap = await db.collection('users').get();
  let batch = db.batch();
  let ops = 0;
  usersSnap.forEach(doc => {
    batch.update(doc.ref, {
      points: 0,
      totalSessions: 0,
      totalSessionTime: 0,
      totalSessionTimeMinutes: 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    ops++;
    if (ops >= 400) {
      // commit in chunks to avoid exceeding limits
      batch.commit();
      batch = db.batch();
      ops = 0;
    }
  });
  if (ops > 0) {
    await batch.commit();
  }

  console.log('Cleanup and reset complete.');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});


