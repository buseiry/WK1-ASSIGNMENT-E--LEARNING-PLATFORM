import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

const db = admin.firestore();

// Configuration
const STUCK_SESSION_THRESHOLD_HOURS = 24;
const STUCK_SESSION_THRESHOLD_MS =
  STUCK_SESSION_THRESHOLD_HOURS * 60 * 60 * 1000;

/**
 * Helper to safely extract error message + stack
 */
function parseError(error: unknown) {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }
  return { message: String(error), stack: "" };
}

/**
 * Scheduled function to cleanup stuck sessions
 * Runs every hour to check for sessions that have been stuck for more than 24 hours
 */
export const cleanupStuckSessions = functions.pubsub
  .schedule("every 1 hours")
  .onRun(async (context: any) => {
    console.log("🧹 Starting stuck session cleanup...");

    const now = new Date();
    const cutoffTime = new Date(now.getTime() - STUCK_SESSION_THRESHOLD_MS);

    try {
      const stuckSessionsQuery = await db
        .collection("sessions")
        .where("status", "in", ["active", "paused"])
        .where("startTime", "<", cutoffTime)
        .get();

      if (stuckSessionsQuery.empty) {
        console.log("✅ No stuck sessions found");
        return null;
      }

      console.log(`📋 Found ${stuckSessionsQuery.docs.length} stuck sessions`);

      const batch = db.batch();
      let processedCount = 0;

      for (const doc of stuckSessionsQuery.docs) {
        const sessionData = doc.data();
        const startTime = sessionData.startTime.toDate();
        const sessionAge = now.getTime() - startTime.getTime();
        const pausedAccum = sessionData.pausedAccumMillis || 0;
        const totalTimeMillis = Math.max(0, sessionAge - pausedAccum);

        console.log(
          `📄 Processing session ${doc.id} for user ${sessionData.userId}`
        );

        // End session
        batch.update(doc.ref, {
          status: "ended",
          endTime: admin.firestore.FieldValue.serverTimestamp(),
          totalTimeMillis,
          autoEnded: true,
          autoEndReason: "scheduled_cleanup",
          autoEndedAt: admin.firestore.FieldValue.serverTimestamp(),
          cleanupRunId: `scheduled_${context.eventId}`,
        });

        // Update user
        const userRef = db.collection("users").doc(sessionData.userId);
        batch.update(userRef, {
          activeSession: false,
          lastSessionEnd: admin.firestore.FieldValue.serverTimestamp(),
        });

        processedCount++;
      }

      if (processedCount > 0) {
        console.log(`💾 Committing ${processedCount} updates...`);
        await batch.commit();

        await db.collection("adminActions").add({
          adminUid: "scheduled_cleanup",
          action: "cleanup_stuck_sessions",
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          reason: "scheduled_cleanup",
          details: {
            thresholdHours: STUCK_SESSION_THRESHOLD_HOURS,
            sessionsProcessed: processedCount,
            cutoffTime: cutoffTime.toISOString(),
            runId: context.eventId,
          },
        });

        console.log("✅ Cleanup completed successfully");
      }

      return null;
    } catch (error: any) {
      const { message, stack } = parseError(error);
      console.error("❌ Cleanup failed:", message, stack);

      await db.collection("error-logs").add({
        function: "cleanupStuckSessions",
        error: message,
        stack,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        context: {
          eventId: context.eventId,
          thresholdHours: STUCK_SESSION_THRESHOLD_HOURS,
        },
      });

      throw new functions.https.HttpsError(
        "internal",
        "Cleanup failed: " + message
      );
    }
  });

/**
 * Manual cleanup (callable)
 */
export const manualCleanupStuckSessions = functions.https.onCall(
  async (data: any, context: functions.https.CallableContext) => {
    if (!context.auth || !context.auth.token.admin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Admin privileges required"
      );
    }

    const thresholdHours = data.thresholdHours || STUCK_SESSION_THRESHOLD_HOURS;
    const thresholdMs = thresholdHours * 60 * 60 * 1000;
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - thresholdMs);

    try {
      const stuckSessionsQuery = await db
        .collection("sessions")
        .where("status", "in", ["active", "paused"])
        .where("startTime", "<", cutoffTime)
        .get();

      if (stuckSessionsQuery.empty) {
        return {
          success: true,
          message: "No stuck sessions found",
          sessionsProcessed: 0,
        };
      }

      const batch = db.batch();
      let processedCount = 0;
      const processedSessions: any[] = [];

      for (const doc of stuckSessionsQuery.docs) {
        const sessionData = doc.data();
        const startTime = sessionData.startTime.toDate();
        const sessionAge = now.getTime() - startTime.getTime();
        const pausedAccum = sessionData.pausedAccumMillis || 0;
        const totalTimeMillis = Math.max(0, sessionAge - pausedAccum);

        batch.update(doc.ref, {
          status: "ended",
          endTime: admin.firestore.FieldValue.serverTimestamp(),
          totalTimeMillis,
          autoEnded: true,
          autoEndReason: "manual_admin_cleanup",
          autoEndedAt: admin.firestore.FieldValue.serverTimestamp(),
          cleanupRunId: `manual_${Date.now()}`,
        });

        const userRef = db.collection("users").doc(sessionData.userId);
        batch.update(userRef, {
          activeSession: false,
          lastSessionEnd: admin.firestore.FieldValue.serverTimestamp(),
        });

        processedSessions.push({
          sessionId: doc.id,
          userId: sessionData.userId,
          totalTimeMillis,
        });

        processedCount++;
      }

      if (processedCount > 0) {
        await batch.commit();

        await db.collection("adminActions").add({
          adminUid: context.auth.uid,
          action: "manual_cleanup_stuck_sessions",
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          reason: "manual_admin_action",
          details: {
            thresholdHours,
            sessionsProcessed: processedCount,
            cutoffTime: cutoffTime.toISOString(),
            processedSessions,
          },
        });
      }

      return {
        success: true,
        message: `Cleaned ${processedCount} stuck sessions`,
        sessionsProcessed: processedCount,
        processedSessions,
      };
    } catch (error: any) {
      const { message, stack } = parseError(error);
      console.error("❌ Manual cleanup failed:", message, stack);

      await db.collection("error-logs").add({
        function: "manualCleanupStuckSessions",
        error: message,
        stack,
        adminUid: context.auth?.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        context: { thresholdHours },
      });

      throw new functions.https.HttpsError(
        "internal",
        "Cleanup failed: " + message
      );
    }
  }
);

/**
 * Get cleanup statistics (callable)
 */
export const getCleanupStats = functions.https.onCall(
  async (data: any, context: functions.https.CallableContext) => {
    if (!context.auth || !context.auth.token.admin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Admin privileges required"
      );
    }

    try {
      const now = new Date();
      const cutoffTime = new Date(now.getTime() - STUCK_SESSION_THRESHOLD_MS);

      const [activeSessions, pausedSessions, endedSessions, stuckSessions] =
        await Promise.all([
          db.collection("sessions").where("status", "==", "active").get(),
          db.collection("sessions").where("status", "==", "paused").get(),
          db.collection("sessions").where("status", "==", "ended").get(),
          db
            .collection("sessions")
            .where("status", "in", ["active", "paused"])
            .where("startTime", "<", cutoffTime)
            .get(),
        ]);

      const usersWithActiveSessions = await db
        .collection("users")
        .where("activeSession", "==", true)
        .get();

      return {
        success: true,
        stats: {
          activeSessions: activeSessions.size,
          pausedSessions: pausedSessions.size,
          endedSessions: endedSessions.size,
          stuckSessions: stuckSessions.size,
          usersWithActiveSessions: usersWithActiveSessions.size,
          thresholdHours: STUCK_SESSION_THRESHOLD_HOURS,
          cutoffTime: cutoffTime.toISOString(),
        },
      };
    } catch (error: any) {
      const { message } = parseError(error);
      console.error("❌ Get cleanup stats failed:", message);

      throw new functions.https.HttpsError(
        "internal",
        "Failed to get cleanup stats: " + message
      );
    }
  }
);