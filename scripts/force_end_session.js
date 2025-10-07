#!/usr/bin/env node

/**
 * Force End Session Script
 * 
 * This script allows administrators to force end a specific session
 * Usage: node force_end_session.js <sessionId> [reason]
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin
if (!admin.apps.length) {
    const serviceAccount = require('../serviceAccountKey.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'reading-streak'
    });
}

const db = admin.firestore();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function forceEndSession(sessionId, reason = 'manual_admin_action') {
    try {
        console.log(`🔍 Looking up session: ${sessionId}`);
        
        // Get session document
        const sessionRef = db.collection('sessions').doc(sessionId);
        const sessionDoc = await sessionRef.get();
        
        if (!sessionDoc.exists) {
            console.log('❌ Session not found');
            return;
        }
        
        const sessionData = sessionDoc.data();
        console.log('📄 Session details:');
        console.log(`   User ID: ${sessionData.userId}`);
        console.log(`   Status: ${sessionData.status}`);
        console.log(`   Started: ${sessionData.startAt?.toDate()}`);
        console.log(`   Created: ${sessionData.createdAt?.toDate()}`);
        
        if (sessionData.status === 'ended') {
            console.log('⚠️  Session is already ended');
            return;
        }
        
        // Calculate total active time
        const now = admin.firestore.Timestamp.now();
        const totalDuration = now.toMillis() - sessionData.startAt.toMillis();
        const totalActiveTime = Math.max(0, totalDuration - (sessionData.pausedAccumMillis || 0));
        
        console.log(`⏱️  Total duration: ${Math.floor(totalDuration / (1000 * 60))} minutes`);
        console.log(`⏱️  Active time: ${Math.floor(totalActiveTime / (1000 * 60))} minutes`);
        
        // Confirm action
        const confirm = await new Promise((resolve) => {
            rl.question('Are you sure you want to force end this session? (y/N): ', resolve);
        });
        
        if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
            console.log('❌ Operation cancelled');
            return;
        }
        
        // Force end session using transaction
        await db.runTransaction(async (transaction) => {
            // Update session
            transaction.update(sessionRef, {
                status: 'ended',
                endAt: now,
                totalTimeMillis: totalActiveTime,
      autoEnded: true,
                autoEndReason: reason,
                forceEnded: true,
                forceEndedAt: now,
                forceEndedBy: 'admin_script'
            });
            
            // Update user
            const userRef = db.collection('users').doc(sessionData.userId);
            transaction.update(userRef, {
      activeSession: false,
                lastSessionEnd: now,
                lastActive: now
            });
        });
        
        // Log admin action
        await db.collection('adminActions').add({
            adminUid: 'script_force_end',
            action: 'force_end_session',
            timestamp: now,
            reason: reason,
            details: {
                sessionId: sessionId,
                userId: sessionData.userId,
                totalActiveTime: Math.floor(totalActiveTime / (1000 * 60)),
                originalStatus: sessionData.status
            }
        });
        
        console.log('✅ Session force ended successfully');
        console.log(`📊 Total active time: ${Math.floor(totalActiveTime / (1000 * 60))} minutes`);
        
    } catch (error) {
        console.error('❌ Error force ending session:', error);
    } finally {
        rl.close();
    }
}

// Get command line arguments
const sessionId = process.argv[2];
const reason = process.argv[3] || 'manual_admin_action';

if (!sessionId) {
    console.log('Usage: node force_end_session.js <sessionId> [reason]');
    console.log('Example: node force_end_session.js abc123 "user_requested"');
        process.exit(1);
}

// Run the script
forceEndSession(sessionId, reason)
    .then(() => {
        console.log('Script completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Script failed:', error);
    process.exit(1);
    });