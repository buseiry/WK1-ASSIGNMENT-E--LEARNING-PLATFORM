import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import cors from "cors";

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// CORS configuration
const corsHandler = cors({ origin: true });

export const startSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Login required");
  const uid = context.auth.uid;

  const user = await db.collection("users").doc(uid).get();
  const userData = user.exists ? user.data() : undefined;
  const isPaid = !!(userData?.hasPaid || userData?.paymentStatus);
  if (!isPaid) {
    throw new functions.https.HttpsError("failed-precondition", "Payment required to start session");
  }

  const sessionRef = db.collection("sessions").doc(uid);
  await sessionRef.set(
    {
      userId: uid,
      status: "active", // active | paused | completed
      active: true,
      // Write both field names for frontend compatibility
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
      startAt: admin.firestore.FieldValue.serverTimestamp(),
      lastResumedAt: admin.firestore.FieldValue.serverTimestamp(),
      totalActiveMs: 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  const createdSnap = await sessionRef.get();
  const createdData = createdSnap.data() || {};

  return {
    success: true,
    session: {
      id: createdSnap.id,
      ...createdData,
      status: createdData.status || "active",
    },
  };
});

export const pauseSession = functions.https.onCall(async (_, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Login required");
  const uid = context.auth.uid;

  const ref = db.collection("sessions").doc(uid);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const data = snap.data() as any;
    const now = admin.firestore.Timestamp.now();
    const lastResumedAt: admin.firestore.Timestamp | undefined = data?.lastResumedAt;
    const prevTotalActiveMs: number = Number(data?.totalActiveMs || 0);
    const addMs = lastResumedAt ? now.toMillis() - lastResumedAt.toMillis() : 0;
    const newTotal = Math.max(0, prevTotalActiveMs + addMs);

    tx.update(ref, {
      active: false,
      status: "paused",
      pausedAt: now,
      totalActiveMs: newTotal,
      updatedAt: now,
    });
  });

  return { success: true };
});

export const resumeSession = functions.https.onCall(async (_, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Login required");
  const uid = context.auth.uid;

  await db.collection("sessions").doc(uid).update({
    active: true,
    status: "active",
    lastResumedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true };
});

export const endSession = functions.https.onCall(async (_, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Login required");
  const uid = context.auth.uid;

  const sessionRef = db.collection("sessions").doc(uid);
  const snap = await sessionRef.get();
  if (!snap.exists) {
    throw new functions.https.HttpsError("failed-precondition", "No active session to end");
  }
  const data = snap.data() as any;

  const now = admin.firestore.Timestamp.now();
  const startedAt: admin.firestore.Timestamp | undefined = data?.startedAt;
  const lastResumedAt: admin.firestore.Timestamp | undefined = data?.lastResumedAt;
  const totalActiveMsStored: number = Number(data?.totalActiveMs || 0);
  const addActiveMs = data?.status === "active" && lastResumedAt ? now.toMillis() - lastResumedAt.toMillis() : 0;
  const totalActiveMs = Math.max(0, totalActiveMsStored + addActiveMs);
  const activeMinutes = Math.floor(totalActiveMs / 60000);

  await sessionRef.set(
    {
      active: false,
      status: "completed",
      endedAt: now,
      durationMs: totalActiveMs,
      durationMinutes: activeMinutes,
      totalActiveMs,
      updatedAt: now,
    },
    { merge: true }
  );

  // Award points only if full 60 active minutes completed
  const awardPoint = activeMinutes >= 60;

  await db
    .collection("users")
    .doc(uid)
    .set(
      {
        points: awardPoint ? admin.firestore.FieldValue.increment(5) : admin.firestore.FieldValue.increment(0),
        totalSessions: admin.firestore.FieldValue.increment(1),
        totalSessionTimeMinutes: admin.firestore.FieldValue.increment(activeMinutes),
        updatedAt: now,
      },
      { merge: true }
    );

  return { success: true, pointsAwarded: awardPoint ? 5 : 0, durationMinutes: activeMinutes };
});

// HTTP versions for CORS compatibility
export const endSessionHTTP = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const token = authHeader.split('Bearer ')[1];
      if (!token) {
        res.status(401).json({ error: 'Invalid token format' });
        return;
      }
      const decodedToken = await admin.auth().verifyIdToken(token);
      const uid = decodedToken.uid;

      const sessionRef = db.collection("sessions").doc(uid);
      const snap = await sessionRef.get();
      if (!snap.exists) {
        res.status(400).json({ error: "No active session to end" });
        return;
      }
      const data = snap.data() as any;

      const now = admin.firestore.Timestamp.now();
      const startedAt: admin.firestore.Timestamp | undefined = data?.startedAt;
      const lastResumedAt: admin.firestore.Timestamp | undefined = data?.lastResumedAt;
      const totalActiveMsStored: number = Number(data?.totalActiveMs || 0);
      const addActiveMs = data?.status === "active" && lastResumedAt ? now.toMillis() - lastResumedAt.toMillis() : 0;
      const totalActiveMs = Math.max(0, totalActiveMsStored + addActiveMs);
      const activeMinutes = Math.floor(totalActiveMs / 60000);

      await sessionRef.set(
        {
          active: false,
          status: "completed",
          endedAt: now,
          durationMs: totalActiveMs,
          durationMinutes: activeMinutes,
          totalActiveMs,
          updatedAt: now,
        },
        { merge: true }
      );

      // Award points only if full 60 active minutes completed
      const awardPoint = activeMinutes >= 60;

      await db
        .collection("users")
        .doc(uid)
        .set(
          {
            points: awardPoint ? admin.firestore.FieldValue.increment(5) : admin.firestore.FieldValue.increment(0),
            totalSessions: admin.firestore.FieldValue.increment(1),
            totalSessionTimeMinutes: admin.firestore.FieldValue.increment(activeMinutes),
            updatedAt: now,
          },
          { merge: true }
        );

      res.json({ success: true, pointsAwarded: awardPoint ? 5 : 0, durationMinutes: activeMinutes });
    } catch (error) {
      console.error('Error in endSessionHTTP:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
});