#!/usr/bin/env node

/**
 * Cleanup Stuck Sessions Script
 * 
 * This script manually cleans up stuck sessions older than a specified threshold
 * Usage: node cleanup_stuck_sessions.js [--hours=24] [--dry-run]
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

async function cleanupStuckSessions(thresholdHours = 24, dryRun = false) {
    try {
        console.log(`🧹 ${dryRun ? 'DRY RUN: ' : ''}Cleaning up stuck sessions older than ${thresholdHours} hours...\n`);
        
        const now = new Date();
        const cutoffTime = new Date(now.getTime() - (thresholdHours * 60 * 60 * 1000));
        
        console.log(`📅 Cutoff time: ${cutoffTime.toLocaleString()}`);
        
        // Find stuck sessions
        const stuckSessionsQuery = await db
            .collection('sessions')
            .where('status', 'in', ['active', 'paused'])
            .where('startAt', '<', cutoffTime)
            .get();
        
        if (stuckSessionsQuery.empty) {
            console.log('✅ No stuck sessions found');
            return;
        }
        
        console.log(`📊 Found ${stuckSessionsQuery.docs.length} stuck sessions:\n`);
        
        const sessionsToProcess = [];
        
        for (const doc of stuckSessionsQuery.docs) {
            const sessionData = doc.data();
            const startTime = sessionData.startAt?.toDate();
            const hoursSinceStart = Math.floor((now - startTime) / (1000 * 60 * 60));
            const totalDuration = now.getTime() - startTime.getTime();
            const totalActiveTime = Math.max(0, totalDuration - (sessionData.pausedAccumMillis || 0));
            
            console.log(`   - ${doc.id} (${sessionData.userId}):`);
            console.log(`     Status: ${sessionData.status}`);
            console.log(`     Started: ${startTime.toLocaleString()}`);
            console.log(`     Age: ${hoursSinceStart} hours`);
            console.log(`     Active time: ${Math.floor(totalActiveTime / (1000 * 60))} minutes`);
            console.log('');
            
            sessionsToProcess.push({
                doc,
                sessionData,
                totalActiveTime,
                hoursSinceStart
            });
        }
        
        if (dryRun) {
            console.log('🔍 DRY RUN: No sessions were actually modified');
            console.log(`📊 Would process ${sessionsToProcess.length} sessions`);
            return;
        }
        
        // Confirm cleanup
        const confirm = await new Promise((resolve) => {
            rl.question(`Are you sure you want to cleanup ${sessionsToProcess.length} stuck sessions? (y/N): `, resolve);
        });
        
        if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
            console.log('❌ Cleanup cancelled');
            return;
        }
        
        // Process sessions in batches
        const batchSize = 10;
        let processedCount = 0;
        
        for (let i = 0; i < sessionsToProcess.length; i += batchSize) {
            const batch = db.batch();
            const batchSessions = sessionsToProcess.slice(i, i + batchSize);
            
            for (const { doc, sessionData, totalActiveTime } of batchSessions) {
                // Update session
                batch.update(doc.ref, {
                    status: 'ended',
                    endAt: admin.firestore.FieldValue.serverTimestamp(),
                    totalTimeMillis: totalActiveTime,
                    autoEnded: true,
                    autoEndReason: 'manual_cleanup_script',
                    autoEndedAt: admin.firestore.FieldValue.serverTimestamp(),
                    cleanupRunId: `manual_${Date.now()}_${i}`
                });
                
                // Update user
                const userRef = db.collection('users').doc(sessionData.userId);
                batch.update(userRef, {
                    activeSession: false,
                    lastSessionEnd: admin.firestore.FieldValue.serverTimestamp()
                });
            }
            
            await batch.commit();
            processedCount += batchSessions.length;
            console.log(`✅ Processed batch: ${processedCount}/${sessionsToProcess.length} sessions`);
        }
        
        // Log admin action
        await db.collection('adminActions').add({
            adminUid: 'script_cleanup',
            action: 'manual_cleanup_stuck_sessions',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            reason: 'manual_script_cleanup',
            details: {
                thresholdHours,
                sessionsProcessed: processedCount,
                cutoffTime: cutoffTime.toISOString(),
                processedSessions: sessionsToProcess.map(s => ({
                    sessionId: s.doc.id,
                    userId: s.sessionData.userId,
                    totalActiveTime: Math.floor(s.totalActiveTime / (1000 * 60))
                }))
            }
        });
        
        console.log(`\n✅ Cleanup completed successfully!`);
        console.log(`📊 Processed ${processedCount} sessions`);
        
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    } finally {
        rl.close();
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
let thresholdHours = 24;
let dryRun = false;

args.forEach(arg => {
    if (arg.startsWith('--hours=')) {
        thresholdHours = parseInt(arg.split('=')[1]);
    } else if (arg === '--dry-run') {
        dryRun = true;
    }
});

// Run the script
cleanupStuckSessions(thresholdHours, dryRun)
    .then(() => {
        console.log('\nScript completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Script failed:', error);
        process.exit(1);
    });