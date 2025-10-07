// scripts/force_end_session.js
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const svcPath = path.join(ROOT, 'serviceAccountKey.json');

if (fs.existsSync(svcPath)) {
  admin.initializeApp({ credential: admin.credential.cert(require(svcPath)) });
  console.log('✅ Firebase initialized with local serviceAccountKey.json');
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  admin.initializeApp();
  console.log('✅ Firebase initialized with GOOGLE_APPLICATION_CREDENTIALS');
} else {
  console.error('❌ No service account found. Put serviceAccountKey.json in project root or set GOOGLE_APPLICATION_CREDENTIALS.');
  process.exit(1);
}

const db = admin.firestore();

const argv = process.argv.slice(2);
let sessionId = null;
let uid = null;
let dryRun = false;
for (const a of argv) {
  if (a.startsWith('--sessionId=')) sessionId = a.split('=')[1];
  else if (a.startsWith('--uid=')) uid = a.split('=')[1];
  else if (a === '--dry-run') dryRun = true;
}

if (!sessionId && !uid) {
  console.log('Usage:\n  node scripts/force_end_session.js --sessionId=<ID>\n  node scripts/force_end_session.js --uid=<UID> [--dry-run]');
  process.exit(1);
}

async function endSingleSession(docRef, docData) {
  const now = new Date();
  const startTime = docData.startTime && typeof docData.startTime.toDate === 'function'
    ? docData.startTime.toDate()
    : (docData.startTime ? new Date(docData.startTime) : now);
  const pausedAccum = docData.pausedAccumMillis || 0;
  const totalMillis = Math.max(0, now.getTime() - startTime.getTime() - pausedAccum);

  console.log(`  → session ${docRef.id}: user=${docData.userId} start=${startTime.toISOString()} pausedMs=${pausedAccum} totalMillis=${totalMillis}`);

  if (!dryRun) {
    await docRef.update({
      completed: true,
      endTime: admin.firestore.FieldValue.serverTimestamp(),
      totalTimeMillis: totalMillis,
      autoEnded: true,
      autoEndReason: 'manual_force_end_script'
    });
    await db.collection('users').doc(docData.userId).update({
      activeSession: false,
      lastSessionEnd: admin.firestore.FieldValue.serverTimestamp()
    });
  }
}

(async () => {
  try {
    if (sessionId) {
      const docRef = db.collection('sessions').doc(sessionId);
      const snap = await docRef.get();
      if (!snap.exists) {
        console.log(`❌ Session ${sessionId} not found`);
        process.exit(1);
      }
      const data = snap.data();
      if (data.completed) {
        console.log(`ℹ️ Session ${sessionId} is already completed.`);
        process.exit(0);
      }
      console.log(`Found session ${sessionId}, will ${dryRun ? 'DRY-RUN (no writes)' : 'FORCE-END'}`);
      await endSingleSession(docRef, data);
      console.log(dryRun ? '✅ DRY RUN finished' : '✅ Session force-ended');
      process.exit(0);
    }

    if (uid) {
      const q = await db.collection('sessions').where('userId', '==', uid).where('completed', '==', false).get();
      if (q.empty) {
        console.log(`ℹ️ No active sessions found for user ${uid}`);
        process.exit(0);
      }
      console.log(`Found ${q.docs.length} active session(s) for user ${uid}. Will ${dryRun ? 'DRY-RUN (no writes)' : 'FORCE-END'}`);
      for (const doc of q.docs) {
        await endSingleSession(doc.ref, doc.data());
      }
      console.log(dryRun ? '✅ DRY RUN finished' : `✅ Force-ended ${q.docs.length} session(s)`);
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
})();
