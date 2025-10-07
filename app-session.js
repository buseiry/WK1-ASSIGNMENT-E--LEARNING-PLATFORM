// Session Management Methods for ReadingTracker
ReadingTracker.prototype.setupSessionControls = function() {
    const startBtn = document.getElementById('start-session-btn');
    const endBtn = document.getElementById('end-session-btn');

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            this.startSession();
        });
    }

    if (endBtn) {
        endBtn.addEventListener('click', () => {
            this.endSession();
        });
    }
};

ReadingTracker.prototype.startSession = async function() {
    if (!this.currentUser) {
        this.showToast('Please login to start a session', 'error');
        return;
    }

    if (!this.currentUser.emailVerified) {
        this.showToast('Please verify your email to start sessions', 'error');
        return;
    }

    if (this.isSessionActive) {
        this.showToast('Session already active', 'warning');
        return;
    }

    try {
        const startSession = functions.httpsCallable('startSession');
        const result = await startSession();

        if (result.data.success) {
            this.currentSession = result.data.session;
            this.isSessionActive = true;
            this.sessionStartTime = new Date();
            
            this.updateSessionUI();
            this.startSessionTimer();
            this.showToast('Session started! Stay connected for 60 minutes.', 'success');
        } else {
            this.showToast(result.data.error || 'Failed to start session', 'error');
        }
    } catch (error) {
        console.error('Start session error:', error);
        const message = (error && error.message) ? error.message : 'Failed to start session';
        this.showToast(message, 'error');
    }
};

ReadingTracker.prototype.endSession = async function() {
    if (!this.isSessionActive || !this.currentSession) return;

    try {
        const endSession = functions.httpsCallable('endSession');
        const result = await endSession({ sessionId: this.currentSession.id });

        if (result.data.success) {
            this.isSessionActive = false;
            this.currentSession = null;
            this.sessionStartTime = null;
            
            this.stopSessionTimer();
            this.updateSessionUI();
            this.showToast('Session ended', 'info');
            
            await this.loadUserData();
        } else {
            this.showToast(result.data.error || 'Failed to end session', 'error');
        }
    } catch (error) {
        console.error('End session error:', error);
        this.showToast('Failed to end session', 'error');
    }
};

ReadingTracker.prototype.resumeSession = function() {
    if (!this.currentSession) return;

    this.isSessionActive = true;
    this.sessionStartTime = new Date(this.currentSession.startAt.toDate());
    
    this.updateSessionUI();
    this.startSessionTimer();
};

ReadingTracker.prototype.startSessionTimer = function() {
    this.sessionTimer = setInterval(() => {
        this.updateTimer();
    }, 1000);
};

ReadingTracker.prototype.stopSessionTimer = function() {
    if (this.sessionTimer) {
        clearInterval(this.sessionTimer);
        this.sessionTimer = null;
    }
};

ReadingTracker.prototype.updateTimer = function() {
    if (!this.sessionStartTime) return;

    const now = new Date();
    const elapsed = Math.floor((now - this.sessionStartTime) / 1000);
    
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    const minutesEl = document.getElementById('timer-minutes');
    const secondsEl = document.getElementById('timer-seconds');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');

    if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
    if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');

    const progress = Math.min((elapsed / 3600) * 100, 100);
    
    if (progressFill) progressFill.style.width = `${progress}%`;
    if (progressText) progressText.textContent = `${Math.floor(progress)}% Complete`;

    if (elapsed >= 3600) {
        this.completeSession();
    }
};

ReadingTracker.prototype.completeSession = async function() {
    if (!this.currentSession) return;

    try {
        const completeSession = functions.httpsCallable('completeSession');
        const result = await completeSession({ sessionId: this.currentSession.id });

        if (result.data.success) {
            this.isSessionActive = false;
            this.currentSession = null;
            this.sessionStartTime = null;
            
            this.stopSessionTimer();
            this.updateSessionUI();
            this.showToast('Session completed! You earned 1 point.', 'success');
            
            await this.loadUserData();
            await this.loadLeaderboard();
        } else {
            this.showToast(result.data.error || 'Failed to complete session', 'error');
        }
    } catch (error) {
        console.error('Complete session error:', error);
        this.showToast('Failed to complete session', 'error');
    }
};

ReadingTracker.prototype.updateSessionUI = function() {
    const startBtn = document.getElementById('start-session-btn');
    const endBtn = document.getElementById('end-session-btn');
    const timerEl = document.getElementById('session-timer');

    if (this.isSessionActive) {
        if (startBtn) startBtn.classList.add('hidden');
        if (endBtn) endBtn.classList.remove('hidden');
        if (timerEl) timerEl.style.display = 'block';
    } else {
        if (startBtn) startBtn.classList.remove('hidden');
        if (endBtn) endBtn.classList.add('hidden');
        if (timerEl) timerEl.style.display = 'none';
    }
};






