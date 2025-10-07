// Session Management Module
class SessionManager {
    constructor() {
        this.db = window.firebaseDb;
        this.auth = window.firebaseAuth;
        this.functions = window.firebaseFunctions;
        this.currentSession = null;
        this.sessionTimer = null;
        this.connectionTimer = null;
        this.isConnected = true;
        this.sessionStartTime = null;
        this.setupEventListeners();
        this.setupConnectionMonitoring();
    }

    setupEventListeners() {
        document.getElementById('start-session-btn').addEventListener('click', () => this.startSession());
    }

    setupConnectionMonitoring() {
        // Monitor connection state
        window.addEventListener('online', () => {
            this.isConnected = true;
            this.updateConnectionStatus();
        });

        window.addEventListener('offline', () => {
            this.isConnected = false;
            this.updateConnectionStatus();
        });

        // Monitor page visibility
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handlePageHidden();
            } else {
                this.handlePageVisible();
            }
        });

        // Monitor beforeunload to detect disconnection
        window.addEventListener('beforeunload', () => {
            this.handleDisconnection();
        });
    }

    async init() {
        await this.loadCurrentSession();
        this.updateUI();
    }

    async loadCurrentSession() {
        const user = window.authManager.getCurrentUser();
        if (!user) return;

        try {
            // Check for active session
            const sessionsSnapshot = await this.db
                .collection('sessions')
                .where('userId', '==', user.uid)
                .where('completed', '==', false)
                .orderBy('startAt', 'desc')
                .limit(1)
                .get();

            if (!sessionsSnapshot.empty) {
                const sessionDoc = sessionsSnapshot.docs[0];
                this.currentSession = {
                    id: sessionDoc.id,
                    ...sessionDoc.data()
                };
                this.sessionStartTime = this.currentSession.startAt.toDate();
                this.startSessionTimer();
            }
        } catch (error) {
            console.error('Error loading current session:', error);
        }
    }

    async startSession() {
        const user = window.authManager.getCurrentUser();
        if (!user) return;

        if (this.currentSession) {
            this.showError('You already have an active session!');
            return;
        }

        try {
            this.showLoading('Starting session...');

            // Call Cloud Function to start session with server timestamp
            const startSession = this.functions.httpsCallable('startSession');
            const result = await startSession({
                userId: user.uid
            });

            if (result.data.success) {
                this.currentSession = result.data.session;
                this.sessionStartTime = new Date(result.data.session.startAt);
                this.startSessionTimer();
                this.updateUI();
                this.showMessage('Session started! Stay connected for 60 minutes to earn points.', 'success');
            } else {
                this.showError(result.data.error || 'Failed to start session');
            }
        } catch (error) {
            console.error('Error starting session:', error);
            this.showError('Failed to start session. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    startSessionTimer() {
        if (this.sessionTimer) {
            clearInterval(this.sessionTimer);
        }

        this.sessionTimer = setInterval(() => {
            this.updateTimer();
            this.checkSessionCompletion();
        }, 1000);

        this.updateTimer();
    }

    updateTimer() {
        if (!this.sessionStartTime) return;

        const now = new Date();
        const elapsed = Math.floor((now - this.sessionStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;

        // Update timer display
        document.getElementById('timer-minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('timer-seconds').textContent = seconds.toString().padStart(2, '0');

        // Update progress bar
        const progress = Math.min((elapsed / 3600) * 100, 100); // 3600 seconds = 60 minutes
        document.getElementById('progress-fill').style.width = `${progress}%`;

        // Update session status
        if (elapsed < 3600) {
            const remaining = 3600 - elapsed;
            const remainingMinutes = Math.floor(remaining / 60);
            const remainingSeconds = remaining % 60;
            document.getElementById('session-status').textContent = `${remainingMinutes}:${remainingSeconds.toString().padStart(2, '0')} left`;
        } else {
            document.getElementById('session-status').textContent = 'Complete';
        }
    }

    async checkSessionCompletion() {
        if (!this.currentSession || !this.sessionStartTime) return;

        const now = new Date();
        const elapsed = Math.floor((now - this.sessionStartTime) / 1000);

        // Check if 60 minutes have passed
        if (elapsed >= 3600) {
            await this.completeSession();
        }
    }

    async completeSession() {
        if (!this.currentSession) return;

        try {
            this.showLoading('Completing session...');

            // Call Cloud Function to complete session
            const completeSession = this.functions.httpsCallable('completeSession');
            const result = await completeSession({
                sessionId: this.currentSession.id
            });

            if (result.data.success) {
                this.showMessage('Session completed! You earned 1 point.', 'success');
                
                // Trigger Gemini AI analysis
                if (window.geminiManager && window.geminiManager.isGeminiEnabled()) {
                    await window.geminiManager.analyzeCompletedSession({
                        durationMinutes: result.data.durationMinutes,
                        pointsEarned: result.data.points,
                        completed: true
                    });
                }
                
                this.currentSession = null;
                this.sessionStartTime = null;
                this.clearTimer();
                this.updateUI();
                
                // Refresh user data and leaderboard
                await window.authManager.loadUserData();
                if (window.leaderboardManager) {
                    window.leaderboardManager.refreshLeaderboard();
                }
            } else {
                this.showError(result.data.error || 'Failed to complete session');
            }
        } catch (error) {
            console.error('Error completing session:', error);
            this.showError('Failed to complete session. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    async handleDisconnection() {
        if (!this.currentSession) return;

        try {
            // Mark session as disconnected
            await this.db.collection('sessions').doc(this.currentSession.id).update({
                disconnected: true,
                disconnectedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error handling disconnection:', error);
        }
    }

    handlePageHidden() {
        if (this.currentSession) {
            this.showWarning('Page hidden! Stay on this page to earn points.');
        }
    }

    handlePageVisible() {
        if (this.currentSession) {
            this.hideWarning();
        }
    }

    updateConnectionStatus() {
        const warningEl = document.getElementById('session-warning');
        if (!this.isConnected && this.currentSession) {
            warningEl.classList.remove('hidden');
            warningEl.innerHTML = '<i class="fas fa-wifi"></i><p>Connection lost! Reconnect to continue earning points.</p>';
        } else if (this.isConnected) {
            this.hideWarning();
        }
    }

    showWarning(message) {
        const warningEl = document.getElementById('session-warning');
        warningEl.innerHTML = `<i class="fas fa-exclamation-triangle"></i><p>${message}</p>`;
        warningEl.classList.remove('hidden');
    }

    hideWarning() {
        document.getElementById('session-warning').classList.add('hidden');
    }

    clearTimer() {
        if (this.sessionTimer) {
            clearInterval(this.sessionTimer);
            this.sessionTimer = null;
        }
    }

    updateUI() {
        const startBtn = document.getElementById('start-session-btn');
        const timerEl = document.getElementById('session-timer');
        const statusEl = document.getElementById('session-status');

        if (this.currentSession) {
            startBtn.innerHTML = '<i class="fas fa-pause"></i> Session Active';
            startBtn.disabled = true;
            startBtn.classList.remove('btn-success');
            startBtn.classList.add('btn-secondary');
            timerEl.classList.remove('hidden');
            this.showWarning('You must stay connected for the full 60 minutes to earn points!');
        } else {
            startBtn.innerHTML = '<i class="fas fa-play"></i> Start Reading Session';
            startBtn.disabled = false;
            startBtn.classList.remove('btn-secondary');
            startBtn.classList.add('btn-success');
            timerEl.classList.add('hidden');
            this.hideWarning();
            statusEl.textContent = 'Ready';
            
            // Reset timer display
            document.getElementById('timer-minutes').textContent = '00';
            document.getElementById('timer-seconds').textContent = '00';
            document.getElementById('progress-fill').style.width = '0%';
        }
    }

    showLoading(message = 'Loading...') {
        const loadingEl = document.getElementById('loading-screen');
        loadingEl.querySelector('p').textContent = message;
        loadingEl.classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading-screen').classList.add('hidden');
    }

    showMessage(message, type) {
        // Create a temporary message element
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.innerHTML = `
            <div class="message-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(messageEl);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 5000);
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    // Public methods
    getCurrentSession() {
        return this.currentSession;
    }

    isSessionActive() {
        return this.currentSession !== null;
    }
}

// Initialize session manager
window.sessionManager = new SessionManager();