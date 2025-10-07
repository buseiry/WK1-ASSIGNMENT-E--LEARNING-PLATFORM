import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Runs every day at midnight UTC
export const cleanupStuckSessions = functions.pubsub
  .schedule("0 0 * * *") // cron: every day at 00:00 UTC
  .timeZone("UTC")
  .onRun(async () => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24h ago
    const sessionsRef = db.collection("sessions");

    const stuckSessions = await sessionsRef
      .where("completed", "==", false)
      .where("startTime", "<", new Date(cutoff))
      .get();

    if (stuckSessions.empty) {
      console.log("✅ No stuck sessions found.");
      return null;
    }

    console.log(`⚠ Found ${stuckSessions.size} stuck sessions. Cleaning...`);

    const batch = db.batch();

    stuckSessions.forEach((doc) => {
      batch.update(doc.ref, {
        completed: true,
        endTime: new Date(),
      });
    });

    await batch.commit();

    console.log("🎉 Cleanup finished.");
    return null;
  });
