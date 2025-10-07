// Authentication Methods for ReadingTracker
ReadingTracker.prototype.setupNavigation = function() {
    const navLinks = {
        'nav-dashboard': 'dashboard-page',
        'nav-leaderboard': 'leaderboard-page',
        'nav-profile': 'dashboard-page'
    };

    Object.entries(navLinks).forEach(([linkId, pageId]) => {
        const link = document.getElementById(linkId);
        if (link) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.showPage(pageId);
            });
        }
    });

    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            this.logout();
        });
    }
};

ReadingTracker.prototype.setupAuthForms = function() {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginTab && registerTab) {
        loginTab.addEventListener('click', () => {
            this.switchAuthTab('login');
        });

        registerTab.addEventListener('click', () => {
            this.switchAuthTab('register');
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });
    }

    const resendBtn = document.getElementById('resend-verification');
    if (resendBtn) {
        resendBtn.addEventListener('click', () => {
            this.resendVerification();
        });
    }
};

ReadingTracker.prototype.switchAuthTab = function(tab) {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (tab === 'login') {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    } else {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    }
};

ReadingTracker.prototype.handleLogin = async function() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        // In emulator/dev, ensure Firestore profile exists and mark payment verified
        try {
            const devEnsure = functions.httpsCallable('devEnsureProfile');
            await devEnsure();
        } catch (_) {}

        if (!userCredential.user.emailVerified) {
            this.showVerificationMessage();
            await auth.signOut();
            return;
        }

        this.showToast('Login successful!', 'success');
    } catch (error) {
        console.error('Login error:', error);
        this.showToast(this.getErrorMessage(error), 'error');
    }
};

ReadingTracker.prototype.handleRegister = async function() {
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm').value;

    if (password !== confirmPassword) {
        this.showToast('Passwords do not match', 'error');
        return;
    }

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.sendEmailVerification();
        // In emulator/dev, create profile immediately for ease of testing
        try {
            const devEnsure = functions.httpsCallable('devEnsureProfile');
            await devEnsure();
        } catch (_) {}
        
        this.showVerificationMessage();
        this.showToast('Registration successful! Please verify your email.', 'success');
    } catch (error) {
        console.error('Registration error:', error);
        this.showToast(this.getErrorMessage(error), 'error');
    }
};

ReadingTracker.prototype.resendVerification = async function() {
    if (!this.currentUser) return;

    try {
        await this.currentUser.sendEmailVerification();
        this.showToast('Verification email sent!', 'success');
    } catch (error) {
        console.error('Resend verification error:', error);
        this.showToast('Failed to send verification email', 'error');
    }
};

ReadingTracker.prototype.showVerificationMessage = function() {
    const verificationMessage = document.getElementById('verification-message');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (verificationMessage) {
        verificationMessage.classList.remove('hidden');
    }
    if (loginForm) {
        loginForm.classList.add('hidden');
    }
    if (registerForm) {
        registerForm.classList.add('hidden');
    }
};

ReadingTracker.prototype.logout = async function() {
    try {
        await auth.signOut();
        this.showToast('Logged out successfully', 'success');
    } catch (error) {
        console.error('Logout error:', error);
        this.showToast('Failed to logout', 'error');
    }
};






