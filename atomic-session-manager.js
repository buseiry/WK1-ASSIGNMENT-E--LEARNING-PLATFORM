// Atomic Session Management Module
// This module provides race-free session start/end operations using Firestore transactions

class AtomicSessionManager {
    constructor(db, auth) {
        this.db = db;
        this.auth = auth;
        this.STUCK_SESSION_THRESHOLD_HOURS = 24; // Configurable threshold for auto-cleanup
        this.STUCK_SESSION_THRESHOLD_MS = this.STUCK_SESSION_THRESHOLD_HOURS * 60 * 60 * 1000;
    }

    /**
     * Atomically start a new session with race condition protection
     * This function uses a Firestore transaction to ensure atomicity
     */
    async startSessionAtomic() {
        const user = this.auth.currentUser;
        if (!user) {
            throw new Error('User must be authenticated');
        }

        const userId = user.uid;
        const now = new Date();

        try {
            // Use transaction to ensure atomicity
            const result = await this.db.runTransaction(async (transaction) => {
                // 1. Read user document and verify payment status
                const userRef = this.db.collection('users').doc(userId);
                const userDoc = await transaction.get(userRef);
                
                if (!userDoc.exists) {
                    throw new Error('User document not found');
                }

                const userData = userDoc.data();
                const isPaid = userData.isPaid === true || userData.paymentStatus === true;
                
                if (!isPaid) {
                    throw new Error('Payment required to start sessions');
                }

                // 2. Query for existing active sessions
                const activeSessionsQuery = await this.db
                    .collection('sessions')
                    .where('userId', '==', userId)
                    .where('status', 'in', ['active', 'paused'])
                    .get();

                // 3. Handle existing active sessions
                if (!activeSessionsQuery.empty) {
                    const activeSessions = activeSessionsQuery.docs;
                    let hasRecentActiveSession = false;

                    // Check each active session
                    for (const sessionDoc of activeSessions) {
                        const sessionData = sessionDoc.data();
                        const sessionStartTime = sessionData.startTime.toDate();
                        const sessionAge = now.getTime() - sessionStartTime.getTime();

                        if (sessionAge < this.STUCK_SESSION_THRESHOLD_MS) {
                            // Recent active session - don't auto-cleanup
                            hasRecentActiveSession = true;
                        } else {
                            // Stuck session - auto-cleanup
                            const pausedAccum = sessionData.pausedAccumMillis || 0;
                            const totalTimeMillis = sessionAge - pausedAccum;
                            
                            transaction.update(sessionDoc.ref, {
                                status: 'ended',
                                endTime: this.db.FieldValue.serverTimestamp(),
                                totalTimeMillis: Math.max(0, totalTimeMillis),
                                autoEnded: true,
                                autoEndReason: 'stuck_session_cleanup',
                                autoEndedAt: this.db.FieldValue.serverTimestamp()
                            });
                        }
                    }

                    if (hasRecentActiveSession) {
                        throw new Error('You already have an active session');
                    }
                }

                // 4. Create new session document
                const sessionData = {
                    userId: userId,
                    startTime: this.db.FieldValue.serverTimestamp(),
                    status: 'active',
                    pausedAccumMillis: 0,
                    lastPausedAt: null,
                    endTime: null,
                    totalTimeMillis: 0,
                    createdAt: this.db.FieldValue.serverTimestamp()
                };

                const sessionRef = this.db.collection('sessions').doc();
                transaction.set(sessionRef, sessionData);

                // 5. Update user's activeSession status
                transaction.update(userRef, {
                    activeSession: true,
                    lastSessionStart: this.db.FieldValue.serverTimestamp()
                });

                return {
                    sessionId: sessionRef.id,
                    sessionData: sessionData
                };
            });

            return {
                success: true,
                sessionId: result.sessionId,
                sessionData: result.sessionData
            };

        } catch (error) {
            console.error('Atomic session start failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Atomically end a session with race condition protection
     */
    async endSessionAtomic(sessionId) {
        const user = this.auth.currentUser;
        if (!user) {
            throw new Error('User must be authenticated');
        }

        const userId = user.uid;

        try {
            const result = await this.db.runTransaction(async (transaction) => {
                // 1. Read session document
                const sessionRef = this.db.collection('sessions').doc(sessionId);
                const sessionDoc = await transaction.get(sessionRef);

                if (!sessionDoc.exists) {
                    throw new Error('Session not found');
                }

                const sessionData = sessionDoc.data();

                // 2. Verify ownership
                if (sessionData.userId !== userId) {
                    throw new Error('Session does not belong to user');
                }

                // 3. Check if already ended (idempotent operation)
                if (sessionData.status === 'ended') {
                    return {
                        success: true,
                        message: 'Session already ended',
                        sessionData: sessionData
                    };
                }

                // 4. Calculate final elapsed time
                const startTime = sessionData.startTime.toDate();
                const pausedAccum = sessionData.pausedAccumMillis || 0;
                const now = new Date();
                const totalTimeMillis = now.getTime() - startTime.getTime() - pausedAccum;

                // 5. Update session as ended
                transaction.update(sessionRef, {
                    status: 'ended',
                    endTime: this.db.FieldValue.serverTimestamp(),
                    totalTimeMillis: Math.max(0, totalTimeMillis),
                    completed: true
                });

                // 6. Update user's activeSession status
                const userRef = this.db.collection('users').doc(userId);
                transaction.update(userRef, {
                    activeSession: false,
                    lastSessionEnd: this.db.FieldValue.serverTimestamp()
                });

                return {
                    success: true,
                    totalTimeMillis: totalTimeMillis,
                    sessionData: {
                        ...sessionData,
                        status: 'ended',
                        endTime: now,
                        totalTimeMillis: totalTimeMillis
                    }
                };
            });

            return result;

        } catch (error) {
            console.error('Atomic session end failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Atomically pause a session
     */
    async pauseSessionAtomic(sessionId) {
        const user = this.auth.currentUser;
        if (!user) {
            throw new Error('User must be authenticated');
        }

        const userId = user.uid;

        try {
            const result = await this.db.runTransaction(async (transaction) => {
                const sessionRef = this.db.collection('sessions').doc(sessionId);
                const sessionDoc = await transaction.get(sessionRef);

                if (!sessionDoc.exists) {
                    throw new Error('Session not found');
                }

                const sessionData = sessionDoc.data();

                if (sessionData.userId !== userId) {
                    throw new Error('Session does not belong to user');
                }

                if (sessionData.status !== 'active') {
                    throw new Error('Session is not active');
                }

                // Update session to paused
                transaction.update(sessionRef, {
                    status: 'paused',
                    lastPausedAt: this.db.FieldValue.serverTimestamp()
                });

                // Update user's activeSession status
                const userRef = this.db.collection('users').doc(userId);
                transaction.update(userRef, {
                    activeSession: false
                });

                return { success: true };
            });

            return result;

        } catch (error) {
            console.error('Atomic session pause failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Atomically resume a session
     */
    async resumeSessionAtomic(sessionId, pausedIntervalMs) {
        const user = this.auth.currentUser;
        if (!user) {
            throw new Error('User must be authenticated');
        }

        const userId = user.uid;

        try {
            const result = await this.db.runTransaction(async (transaction) => {
                const sessionRef = this.db.collection('sessions').doc(sessionId);
                const sessionDoc = await transaction.get(sessionRef);

                if (!sessionDoc.exists) {
                    throw new Error('Session not found');
                }

                const sessionData = sessionDoc.data();

                if (sessionData.userId !== userId) {
                    throw new Error('Session does not belong to user');
                }

                if (sessionData.status !== 'paused') {
                    throw new Error('Session is not paused');
                }

                // Update session to active and increment paused time
                transaction.update(sessionRef, {
                    status: 'active',
                    pausedAccumMillis: this.db.FieldValue.increment(pausedIntervalMs),
                    lastPausedAt: null
                });

                // Update user's activeSession status
                const userRef = this.db.collection('users').doc(userId);
                transaction.update(userRef, {
                    activeSession: true
                });

                return { success: true };
            });

            return result;

        } catch (error) {
            console.error('Atomic session resume failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Force end a session (admin only)
     */
    async forceEndSessionAtomic(sessionId, adminUserId) {
        try {
            const result = await this.db.runTransaction(async (transaction) => {
                // 1. Verify admin privileges
                const adminRef = this.db.collection('users').doc(adminUserId);
                const adminDoc = await transaction.get(adminRef);
                
                if (!adminDoc.exists || !adminDoc.data().admin) {
                    throw new Error('Admin privileges required');
                }

                // 2. Read session document
                const sessionRef = this.db.collection('sessions').doc(sessionId);
                const sessionDoc = await transaction.get(sessionRef);

                if (!sessionDoc.exists) {
                    throw new Error('Session not found');
                }

                const sessionData = sessionDoc.data();

                // 3. Calculate final elapsed time
                const startTime = sessionData.startTime.toDate();
                const pausedAccum = sessionData.pausedAccumMillis || 0;
                const now = new Date();
                const totalTimeMillis = now.getTime() - startTime.getTime() - pausedAccum;

                // 4. Update session as force-ended
                transaction.update(sessionRef, {
                    status: 'ended',
                    endTime: this.db.FieldValue.serverTimestamp(),
                    totalTimeMillis: Math.max(0, totalTimeMillis),
                    forceEnded: true,
                    forceEndedBy: adminUserId,
                    forceEndReason: 'admin_action',
                    forceEndedAt: this.db.FieldValue.serverTimestamp()
                });

                // 5. Update user's activeSession status
                const userRef = this.db.collection('users').doc(sessionData.userId);
                transaction.update(userRef, {
                    activeSession: false,
                    lastSessionEnd: this.db.FieldValue.serverTimestamp()
                });

                // 6. Log admin action
                const adminActionRef = this.db.collection('adminActions').doc();
                transaction.set(adminActionRef, {
                    adminUid: adminUserId,
                    action: 'force_end_session',
                    targetUid: sessionData.userId,
                    sessionId: sessionId,
                    timestamp: this.db.FieldValue.serverTimestamp(),
                    reason: 'admin_action'
                });

                return {
                    success: true,
                    totalTimeMillis: totalTimeMillis
                };
            });

            return result;

        } catch (error) {
            console.error('Atomic force end session failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get active session for user
     */
    async getActiveSession(userId) {
        try {
            const activeSessionsQuery = await this.db
                .collection('sessions')
                .where('userId', '==', userId)
                .where('status', 'in', ['active', 'paused'])
                .limit(1)
                .get();

            if (activeSessionsQuery.empty) {
                return null;
            }

            const sessionDoc = activeSessionsQuery.docs[0];
            return {
                id: sessionDoc.id,
                ...sessionDoc.data()
            };

        } catch (error) {
            console.error('Get active session failed:', error);
            return null;
        }
    }
}

// Export for use in other modules
window.AtomicSessionManager = AtomicSessionManager;

