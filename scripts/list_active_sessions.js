#!/usr/bin/env node

/**
 * List Active Sessions Script
 * 
 * This script lists all currently active and paused sessions
 * Usage: node list_active_sessions.js [--detailed]
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
    const serviceAccount = require('../serviceAccountKey.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'reading-streak'
    });
}

const db = admin.firestore();

async function listActiveSessions(detailed = false) {
    try {
        console.log('🔍 Fetching active sessions...\n');
        
        // Get active and paused sessions
        const activeSessionsQuery = await db
            .collection('sessions')
            .where('status', 'in', ['active', 'paused'])
            .orderBy('startAt', 'desc')
            .get();
        
        if (activeSessionsQuery.empty) {
            console.log('✅ No active sessions found');
            return;
        }
        
        console.log(`📊 Found ${activeSessionsQuery.docs.length} active/paused sessions:\n`);
        
        const now = new Date();
        
        activeSessionsQuery.docs.forEach((doc, index) => {
            const sessionData = doc.data();
            const startTime = sessionData.startAt?.toDate();
            const duration = startTime ? Math.floor((now - startTime) / (1000 * 60)) : 0;
            const activeTime = Math.max(0, duration - (sessionData.pausedAccumMillis || 0) / (1000 * 60));
            
            console.log(`${index + 1}. Session ID: ${doc.id}`);
            console.log(`   User ID: ${sessionData.userId}`);
            console.log(`   Status: ${sessionData.status}`);
            console.log(`   Started: ${startTime ? startTime.toLocaleString() : 'Unknown'}`);
            console.log(`   Duration: ${duration} minutes`);
            console.log(`   Active Time: ${Math.floor(activeTime)} minutes`);
            
            if (detailed) {
                console.log(`   Created: ${sessionData.createdAt?.toDate()?.toLocaleString() || 'Unknown'}`);
                console.log(`   Last Paused: ${sessionData.lastPausedAt?.toDate()?.toLocaleString() || 'Never'}`);
                console.log(`   Paused Accum: ${Math.floor((sessionData.pausedAccumMillis || 0) / (1000 * 60))} minutes`);
                console.log(`   Disconnected: ${sessionData.disconnected || false}`);
            }
            
            console.log('   ' + '─'.repeat(50));
        });
        
        // Summary statistics
        const activeCount = activeSessionsQuery.docs.filter(doc => doc.data().status === 'active').length;
        const pausedCount = activeSessionsQuery.docs.filter(doc => doc.data().status === 'paused').length;
        
        console.log('\n📈 Summary:');
        console.log(`   Active sessions: ${activeCount}`);
        console.log(`   Paused sessions: ${pausedCount}`);
        console.log(`   Total: ${activeSessionsQuery.docs.length}`);
        
        // Check for potentially stuck sessions (older than 24 hours)
        const stuckSessions = activeSessionsQuery.docs.filter(doc => {
            const startTime = doc.data().startAt?.toDate();
            if (!startTime) return false;
            const hoursSinceStart = (now - startTime) / (1000 * 60 * 60);
            return hoursSinceStart > 24;
        });
        
        if (stuckSessions.length > 0) {
            console.log(`\n⚠️  Potentially stuck sessions (older than 24 hours): ${stuckSessions.length}`);
            stuckSessions.forEach(doc => {
                const sessionData = doc.data();
                const startTime = sessionData.startAt?.toDate();
                const hoursSinceStart = Math.floor((now - startTime) / (1000 * 60 * 60));
                console.log(`   - ${doc.id} (${sessionData.userId}): ${hoursSinceStart} hours old`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error listing active sessions:', error);
    }
}

// Get command line arguments
const detailed = process.argv.includes('--detailed');

// Run the script
listActiveSessions(detailed)
    .then(() => {
        console.log('\nScript completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Script failed:', error);
        process.exit(1);
    });