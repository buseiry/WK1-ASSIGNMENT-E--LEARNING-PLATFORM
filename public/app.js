// Reading Attendance Tracker - Main Application
// Integrated with Firebase Cloud Functions

// Global variables
let currentUser = null;
let currentSession = null;
let sessionTimer = null;
let sessionStartTime = null;
let autoStopTimer = null;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize the application
function initializeApp() {
    console.log('🚀 Initializing Reading Attendance Tracker');
    
    // Set up navigation
    setupNavigation();
    
    // Set up authentication
    setupAuthentication();
    
    // Set up event listeners
    setupEventListeners();
    
    showStatus('App initialized successfully!', 'success');
}

// Setup navigation between sections
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = link.dataset.section;
            
            // Update active nav link
            navLinks.forEach(nl => nl.classList.remove('active'));
            link.classList.add('active');
            
            // Show target section
            sections.forEach(section => section.classList.remove('active'));
            const target = document.getElementById(targetSection);
            if (target) {
                target.classList.add('active');
            }
        });
    });
}

// Setup authentication
function setupAuthentication() {
    const auth = (typeof window !== 'undefined') ? window.firebaseAuth : null;
    if (!auth) {
        console.warn('firebaseAuth not available yet; skipping auth setup.');
        return;
    }
    
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            await handleUserLogin(user);
        } else {
            handleUserLogout();
        }
    });
}

// Handle user login
async function handleUserLogin(user) {
    console.log('User logged in:', user.email);
    
    // Show user menu
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const userMenu = document.getElementById('user-menu');
    const userEmail = document.getElementById('user-email');
    if (loginBtn) loginBtn.style.display = 'none';
    if (registerBtn) registerBtn.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';
    if (userEmail) userEmail.textContent = user.email;
    
    // Load user data
    await loadUserData();
    
    // Load dashboard content
    loadDashboard();
    
    showStatus(`Welcome back, ${user.email}!`, 'success');
}

// Handle user logout
function handleUserLogout() {
    console.log('User logged out');
    currentUser = null;
    currentSession = null;
    
    // Reset UI
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const userMenu = document.getElementById('user-menu');
    if (loginBtn) loginBtn.style.display = 'inline-block';
    if (registerBtn) registerBtn.style.display = 'inline-block';
    if (userMenu) userMenu.style.display = 'none';
    
    // Show home section
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    const homeLink = document.querySelector('[data-section="home"]');
    if (homeLink) homeLink.classList.add('active');
    document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
    const homeSection = document.getElementById('home');
    if (homeSection) homeSection.classList.add('active');
    
    // Clear session timer
    if (sessionTimer) {
        clearInterval(sessionTimer);
        sessionTimer = null;
    }
    
    showStatus('You have been logged out.', 'info');
}

// Setup event listeners
function setupEventListeners() {
    // Auth buttons
    const loginBtnEl = document.getElementById('login-btn');
    if (loginBtnEl) loginBtnEl.addEventListener('click', () => { showLoginModal(); });
    
    const registerBtnEl = document.getElementById('register-btn');
    if (registerBtnEl) registerBtnEl.addEventListener('click', () => { showRegisterModal(); });
    
    const logoutBtnEl = document.getElementById('logout-btn');
    if (logoutBtnEl) logoutBtnEl.addEventListener('click', async () => { await firebaseAuth.signOut(); });
    
    // Session buttons
    const startEl = document.getElementById('start-session-btn');
    const endEl = document.getElementById('end-session-btn');
    const verifyEl = document.getElementById('verify-session-btn');
    if (startEl) startEl.addEventListener('click', startSession);
    if (endEl) endEl.addEventListener('click', endSession);
    if (verifyEl) verifyEl.addEventListener('click', verifySession);
    
    // Payment button -> navigate to payment page
    const payBtn = document.getElementById('payment-btn');
    if (payBtn) {
        payBtn.addEventListener('click', () => {
            window.location.href = '/payment.html';
        });
    }
    
    // Get started button
    const getStartedEl = document.getElementById('get-started-btn');
    if (getStartedEl) getStartedEl.addEventListener('click', () => { showRegisterModal(); });
}

// Load user data from Firestore
async function loadUserData() {
    if (!currentUser) return;
    
    try {
        const userDoc = await firebaseDb.collection('users').doc(currentUser.uid).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            updateUserStats(userData);
        } else {
            // Create user document if it doesn't exist
            await createUserDocument();
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        showStatus('Error loading user data', 'error');
    }
}

// Create user document
async function createUserDocument() {
    try {
        await firebaseDb.collection('users').doc(currentUser.uid).set({
            email: currentUser.email,
            paymentStatus: false,
            points: 0,
            totalSessions: 0,
            totalSessionTime: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showStatus('User profile created successfully!', 'success');
    } catch (error) {
        console.error('Error creating user document:', error);
        showStatus('Error creating user profile', 'error');
    }
}

// Update user stats in UI
function updateUserStats(userData) {
    document.getElementById('user-points').textContent = userData.points || 0;
    document.getElementById('user-rank').textContent = userData.rank || '-';
    document.getElementById('total-sessions').textContent = userData.totalSessions || 0;
}

// Load dashboard content
function loadDashboard() {
    if (!currentUser) return;
    
    // Check payment status
    checkPaymentStatus();
    
    // Load recent sessions
    loadRecentSessions();
    
    // Check for active session
    checkActiveSession();
}

// Check payment status
async function checkPaymentStatus() {
    try {
        const userDoc = await firebaseDb.collection('users').doc(currentUser.uid).get();
        const userData = userDoc.data();
        
        const paymentRequired = document.getElementById('payment-required');
        const dashboardContent = document.getElementById('dashboard-content');
        
        let hasPaid = !!(userData?.hasPaid || userData?.paymentStatus);

        // Fallback: if not marked paid, check payments collection by email and repair user doc
        if (!hasPaid && currentUser?.email) {
            try {
                const payments = await firebaseDb.collection('payments')
                    .where('email', '==', currentUser.email)
                    .where('status', '==', 'success')
                    .limit(1)
                    .get();
                if (!payments.empty) {
                    await firebaseDb.collection('users').doc(currentUser.uid).set({
                        email: currentUser.email,
                        hasPaid: true,
                        paymentStatus: true,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                    hasPaid = true;
                }
            } catch (e) {
                console.error('Fallback payment check failed:', e);
            }
        }
        if (!hasPaid) {
            paymentRequired.style.display = 'block';
            dashboardContent.style.display = 'none';
        } else {
            paymentRequired.style.display = 'none';
            dashboardContent.style.display = 'grid';
        }
    } catch (error) {
        console.error('Error checking payment status:', error);
    }
}

// Check for active session
async function checkActiveSession() {
    try {
        const sessionDoc = await firebaseDb.collection('sessions').doc(currentUser.uid).get();
        if (sessionDoc.exists) {
            const sessionData = sessionDoc.data();
            currentSession = { id: currentUser.uid, ...sessionData };
            if (currentSession.startedAt) {
                sessionStartTime = currentSession.startedAt.toDate();
                updateSessionUI();
                startSessionTimer();
            }
        }
    } catch (error) {
        console.error('Error checking active session:', error);
    }
}

// Start a new reading session
async function startSession() {
    if (!currentUser) {
        showStatus('Please login first', 'error');
        return;
    }
    
    try {
        const startBtn = document.getElementById('start-session-btn');
        const startBtnText = document.getElementById('start-btn-text');
        
        startBtn.disabled = true;
        startBtnText.innerHTML = '<span class="loading-spinner"></span> Starting...';
        
        showStatus('Starting session...', 'info');
        
        // Call Cloud Function to start session
        const fns = (typeof window !== 'undefined') ? window.firebaseFunctions : null;
        if (!fns) { throw new Error('Cloud Functions SDK not ready'); }
        const startSessionFunction = fns.httpsCallable('startSession');
        const result = await startSessionFunction({
            userId: currentUser.uid
        });
        
        if (result.data.success) {
            // Prefer session returned from backend to avoid race and missing fields
            const returned = result.data.session || null;
            if (returned) {
                currentSession = { id: returned.id || currentUser.uid, ...returned };
            } else {
                // Fallback to fetching
                const doc = await firebaseDb.collection('sessions').doc(currentUser.uid).get();
                currentSession = { id: currentUser.uid, ...doc.data() };
            }

            // Set start time from server fields if available for accurate countdown
            const startedAtTs = (currentSession && (currentSession.startedAt || currentSession.startAt)) || null;
            sessionStartTime = startedAtTs && typeof startedAtTs.toDate === 'function' ? startedAtTs.toDate() : new Date();
            
            showStatus('✅ Session started successfully!', 'success');
            updateSessionUI();
            startSessionTimer();
        } else {
            showStatus('❌ Failed to start session: ' + (result.data.error || 'Unknown error'), 'error');
        }
        
        startBtn.disabled = false;
        startBtnText.textContent = 'Start Session';
        
    } catch (error) {
        console.error('Error starting session:', error);
        showStatus('❌ Error starting session: ' + error.message, 'error');
        
        const startBtn = document.getElementById('start-session-btn');
        const startBtnText = document.getElementById('start-btn-text');
        startBtn.disabled = false;
        startBtnText.textContent = 'Start Session';
    }
}

// End current session
async function endSession() {
    if (!currentSession) {
        showStatus('No active session to end', 'error');
        return;
    }
    
    try {
        const endBtn = document.getElementById('end-session-btn');
        const endBtnText = document.getElementById('end-btn-text');
        
        endBtn.disabled = true;
        endBtnText.innerHTML = '<span class="loading-spinner"></span> Ending...';
        
        showStatus('Ending session...', 'info');
        
        // Call Cloud Function to end session
        const fns = (typeof window !== 'undefined') ? window.firebaseFunctions : null;
        if (!fns) { throw new Error('Cloud Functions SDK not ready'); }
        const endFn = fns.httpsCallable('endSession');
        const result = await endFn({});
        
        if (result.data.success) {
            const awarded = Number(result.data.pointsAwarded || 0);
            if (awarded > 0) {
                showStatus(`✅ Session completed! You earned ${awarded} point.`, 'success');
            } else {
                showStatus('✅ Session ended. You need a full 60 minutes of active time to earn a point.', 'info');
            }
            
            currentSession = null;
            sessionStartTime = null;
            if (sessionTimer) { clearInterval(sessionTimer); sessionTimer = null; }
            if (autoStopTimer) { clearTimeout(autoStopTimer); autoStopTimer = null; }
            
            updateSessionUI();
            // Reset timer display to 00:00
            const timerEl = document.getElementById('session-timer');
            if (timerEl) timerEl.textContent = '00:00';
            loadUserData(); // Refresh user stats
        } else {
            showStatus('❌ Failed to complete session: ' + (result.data.error || 'Unknown error'), 'error');
        }
        
        endBtn.disabled = false;
        endBtnText.textContent = 'End Session';
        
    } catch (error) {
        console.error('Error ending session:', error);
        showStatus('❌ Error ending session: ' + error.message, 'error');
        
        const endBtn = document.getElementById('end-session-btn');
        const endBtnText = document.getElementById('end-btn-text');
        endBtn.disabled = false;
        endBtnText.textContent = 'End Session';
    }
}

// Verify current session
async function verifySession() {
    if (!currentSession) {
        showStatus('No active session to verify', 'error');
        return;
    }
    
    try {
        showStatus('Verifying session...', 'info');
        
        const fns = (typeof window !== 'undefined') ? window.firebaseFunctions : null;
        if (!fns) { throw new Error('Cloud Functions SDK not ready'); }
        const verifySessionFunction = fns.httpsCallable('verifySession');
        const result = await verifySessionFunction({
            sessionId: currentSession.id
        });
        
        if (result.data.success) {
            showStatus('✅ Session verified successfully!', 'success');
        } else {
            showStatus('❌ Session verification failed: ' + result.data.message, 'error');
        }
        
    } catch (error) {
        console.error('Error verifying session:', error);
        showStatus('❌ Error verifying session: ' + error.message, 'error');
    }
}

// Update session UI
function updateSessionUI() {
    const sessionInfo = document.getElementById('session-info');
    const startBtn = document.getElementById('start-session-btn');
    const endBtn = document.getElementById('end-session-btn');
    const verifyBtn = document.getElementById('verify-session-btn');
    const timer = document.getElementById('session-timer');
    
    if (currentSession) {
        sessionInfo.innerHTML = `
            <div class="session-info">
                <h4>📚 Active Session</h4>
                <p><strong>Session ID:</strong> ${currentSession.id}</p>
                <p><strong>Started:</strong> ${sessionStartTime ? sessionStartTime.toLocaleString() : 'Unknown'}</p>
                <p><strong>Status:</strong> ${(currentSession && currentSession.status) ? currentSession.status : 'Active'}</p>
            </div>
        `;
        startBtn.style.display = 'none';
        endBtn.style.display = 'inline-block';
        verifyBtn.style.display = 'none';
        timer.style.display = 'block';
    } else {
        sessionInfo.innerHTML = '<p>Ready to start a new reading session?</p>';
        startBtn.style.display = 'inline-block';
        endBtn.style.display = 'none';
        verifyBtn.style.display = 'none';
        timer.style.display = 'none';
    }
}

// Start session timer
function startSessionTimer() {
    if (sessionTimer) {
        clearInterval(sessionTimer);
    }
    
    sessionTimer = setInterval(() => {
        if (sessionStartTime) {
            const now = new Date();
            const elapsedMs = Math.max(0, now - sessionStartTime);
            const totalMs = 60 * 60 * 1000;
            const remainingMs = Math.max(0, totalMs - elapsedMs);
            const remMinutes = Math.floor(remainingMs / 60000);
            const remSeconds = Math.floor((remainingMs % 60000) / 1000);

            const countdown = `${remMinutes.toString().padStart(2, '0')}:${remSeconds.toString().padStart(2, '0')}`;
    const timerTextEl = document.getElementById('session-timer');
    if (timerTextEl) timerTextEl.textContent = countdown;

            if (remainingMs === 0) {
                clearInterval(sessionTimer);
                sessionTimer = null;
                endSession();
            }
        }
    }, 1000);
}

// Load recent sessions
async function loadRecentSessions() {
    try {
        const sessionsQuery = await firebaseDb.collection('sessions')
            .where('userId', '==', currentUser.uid)
            .orderBy('startAt', 'desc')
            .limit(5)
            .get();
        
        const recentSessions = document.getElementById('recent-sessions');
        
        if (sessionsQuery.empty) {
            recentSessions.innerHTML = '<p class="empty-state">No sessions yet. Start your first reading session!</p>';
            return;
        }
        
        let html = '';
        sessionsQuery.docs.forEach(doc => {
            const session = doc.data();
            const startTime = session.startAt ? session.startAt.toDate().toLocaleString() : 'Unknown';
            const duration = session.durationMinutes ? `${session.durationMinutes} min` : 'Incomplete';
            
            html += `
                <div class="session-item">
                    <div class="session-date">${startTime}</div>
                    <div class="session-duration">${duration}</div>
                    <div class="session-status ${session.completed ? 'completed' : 'incomplete'}">
                        ${session.completed ? '✅ Completed' : '⏳ Incomplete'}
                    </div>
                </div>
            `;
        });
        
        recentSessions.innerHTML = html;
    } catch (error) {
        console.error('Error loading recent sessions:', error);
    }
}

// Load leaderboard
async function loadLeaderboard() {
    try {
        const leaderboardQuery = await firebaseDb.collection('users')
            .orderBy('points', 'desc')
            .limit(10)
            .get();
        
        const leaderboardList = document.getElementById('leaderboard-list');
        
        if (leaderboardQuery.empty) {
            leaderboardList.innerHTML = '<p class="empty-state">No leaderboard data yet</p>';
            return;
        }
        
        let html = '';
        leaderboardQuery.docs.forEach((doc, index) => {
            const userData = doc.data();
            const rank = index + 1;
            const name = userData.email ? userData.email.split('@')[0] : 'Anonymous';
            const points = userData.points || 0;
            
            html += `
                <div class="leaderboard-item">
                    <div class="rank">#${rank}</div>
                    <div class="name">${name}</div>
                    <div class="points">${points} pts</div>
                </div>
            `;
        });
        
        leaderboardList.innerHTML = html;
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        const listEl = document.getElementById('leaderboard-list');
        if (listEl) listEl.innerHTML = '<p class="error">Error loading leaderboard</p>';
    }
}

// Show login modal (simplified)
function showLoginModal() {
    // Avoid duplicate sign-in if already authenticated
    if (firebaseAuth.currentUser) {
        showStatus('You are already signed in.', 'info');
        return;
    }

    const email = prompt('Enter your email:');
    if (!email) return;
    const password = prompt('Enter your password:');
    if (!password) return;

    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) loginBtn.disabled = true;

    firebaseAuth.signInWithEmailAndPassword(email, password)
        .then(() => {
            showStatus('Login successful!', 'success');
        })
        .catch(async (error) => {
            if (error && error.code === 'auth/too-many-requests') {
                showStatus('Too many attempts. Please try again later or reset your password.', 'error');
                try {
                    await firebaseAuth.sendPasswordResetEmail(email);
                    showStatus('Password reset email sent. Check your inbox.', 'info');
                } catch (e) {
                    console.error('Password reset error:', e);
                }
            } else {
                showStatus('Login failed: ' + error.message, 'error');
            }
        })
        .finally(() => {
            if (loginBtn) loginBtn.disabled = false;
        });
}

// Show register modal (simplified)
function showRegisterModal() {
    const email = prompt('Enter your email:');
    if (!email) return;
    
    const password = prompt('Enter your password:');
    if (!password) return;
    
    firebaseAuth.createUserWithEmailAndPassword(email, password)
        .then(() => {
            showStatus('Registration successful! Please verify your email.', 'success');
        })
        .catch(error => {
            showStatus('Registration failed: ' + error.message, 'error');
        });
}

// Show payment modal (simplified)
function showPaymentModal() {
    showStatus('Payment integration coming soon! For now, you can manually set payment status in the database.', 'info');
    
    // For testing purposes, allow manual payment status setting
    if (confirm('For testing: Set payment status to paid?')) {
        firebaseDb.collection('users').doc(currentUser.uid).update({
            paymentStatus: true
        }).then(() => {
            showStatus('Payment status updated for testing!', 'success');
            checkPaymentStatus();
        });
    }
}

// Show status message
function showStatus(message, type = 'info') {
    const container = document.getElementById('status-container');
    const statusDiv = document.createElement('div');
    statusDiv.className = `status ${type}`;
    statusDiv.textContent = message;
    container.appendChild(statusDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (statusDiv.parentNode) {
            statusDiv.parentNode.removeChild(statusDiv);
        }
    }, 5000);
}

// Clean up when page unloads
window.addEventListener('beforeunload', () => {
    if (sessionTimer) {
        clearInterval(sessionTimer);
    }
});

// Initialize leaderboard when leaderboard section is shown
document.addEventListener('click', (e) => {
    if (e.target.dataset.section === 'leaderboard') {
        loadLeaderboard();
    }
});

console.log('📚 Reading Attendance Tracker App Loaded');











