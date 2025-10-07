const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const servicePath = path.join(__dirname, '..', 'serviceAccountKey.json');
if (!fs.existsSync(servicePath)) {
  console.error('serviceAccountKey.json not found at', servicePath);
  process.exit(1);
}
const serviceAccount = require(servicePath);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const uidArg = args.find(a => a !== '--dry-run');

async function run() {
  if (uidArg) {
    console.log('Targeting UID:', uidArg, dryRun ? '(dry-run)' : '');
  } else {
    console.log('Targeting all active sessions', dryRun ? '(dry-run)' : '');
  }

  let query = db.collection('sessions').where('status', '==', 'active');
  if (uidArg) query = query.where('userId', '==', uidArg);

  const snap = await query.get();
  if (snap.empty) {
    console.log('No active sessions found.');
    process.exit(0);
  }

  console.log('Found', snap.size, 'active sessions');

  const updatesByUser = new Map();

  for (const doc of snap.docs) {
    const data = doc.data();
    console.log('-', doc.id, 'user:', data.userId, 'startTime:', (data.startTime && data.startTime.toDate()) || 'n/a');
    if (!dryRun) {
      const totalTimeMillis = Date.now() - (data.startTime ? data.startTime.toMillis() : Date.now());
      doc.ref.update({
        status: 'ended',
        endTime: admin.firestore.FieldValue.serverTimestamp(),
        totalTimeMillis,
        autoEnded: true,
        autoEndReason: 'force_end_script',
        autoEndedAt: admin.firestore.FieldValue.serverTimestamp()
      }).catch(err => console.error('Failed update session', doc.id, err));
      updatesByUser.set(data.userId, true);
    }
  }

  if (!dryRun && updatesByUser.size) {
    const batch = db.batch();
    for (const uid of updatesByUser.keys()) {
      const userRef = db.collection('users').doc(uid);
      batch.update(userRef, {
        activeSession: false,
        lastSessionEnd: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    await batch.commit();
    console.log('Cleared activeSession for', updatesByUser.size, 'users');
  }

  console.log('Done');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
