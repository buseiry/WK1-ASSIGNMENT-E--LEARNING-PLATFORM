// Authentication Module
class AuthManager {
    constructor() {
        this.auth = window.firebaseAuth;
        this.db = window.firebaseDb;
        this.currentUser = null;
        this.userData = null;
        this.setupAuthListeners();
        this.setupEventListeners();
    }

    setupAuthListeners() {
        this.auth.onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                await this.loadUserData();
                this.handleAuthenticatedUser();
            } else {
                this.handleUnauthenticatedUser();
            }
        });
    }

    setupEventListeners() {
        // Tab switching
        document.getElementById('login-tab').addEventListener('click', () => this.switchTab('login'));
        document.getElementById('register-tab').addEventListener('click', () => this.switchTab('register'));

        // Form submissions
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('register-form').addEventListener('submit', (e) => this.handleRegister(e));

        // Other buttons
        document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());
        document.getElementById('resend-verification').addEventListener('click', () => this.resendVerification());
        document.getElementById('back-to-login').addEventListener('click', () => this.showAuthScreen());
        document.getElementById('proceed-payment').addEventListener('click', () => this.showPaymentScreen());
        document.getElementById('back-to-register').addEventListener('click', () => this.showRegisterForm());
    }

    switchTab(tab) {
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
    }

    async handleLogin(e) {
        e.preventDefault();
        this.showLoading();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            if (!user.emailVerified) {
                await this.auth.signOut();
                this.showVerificationScreen();
                this.showMessage('Please verify your email before logging in.', 'error');
                return;
            }

            // Check if user needs to pay
            const userDoc = await this.db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                if (!userData.paymentStatus) {
                    await this.auth.signOut();
                    this.showPaymentScreen();
                    this.showMessage('Payment required to access your account.', 'error');
                    return;
                }
            }

            this.showMessage('Login successful!', 'success');
        } catch (error) {
            this.showMessage(this.getErrorMessage(error), 'error');
        } finally {
            this.hideLoading();
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        this.showLoading();

        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match.', 'error');
            this.hideLoading();
            return;
        }

        try {
            // Check if this is the first user or if payment is required
            const userCount = await this.getUserCount();
            
            if (userCount >= 1) {
                // Show payment notice for users after the first one
                this.hideLoading();
                this.showPaymentNotice();
                return;
            }

            // Create user account
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Send verification email
            await user.sendEmailVerification();

            // Create user document
            await this.db.collection('users').doc(user.uid).set({
                email: email,
                verified: false,
                points: 0,
                rank: 0,
                paymentStatus: true, // First user is free
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastActive: firebase.firestore.FieldValue.serverTimestamp()
            });

            this.showVerificationScreen();
            this.showMessage('Registration successful! Please verify your email.', 'success');
        } catch (error) {
            this.showMessage(this.getErrorMessage(error), 'error');
            this.hideLoading();
        }
    }

    async getUserCount() {
        try {
            const snapshot = await this.db.collection('users').get();
            return snapshot.size;
        } catch (error) {
            console.error('Error getting user count:', error);
            return 0;
        }
    }

    async loadUserData() {
        if (!this.currentUser) return;

        try {
            const userDoc = await this.db.collection('users').doc(this.currentUser.uid).get();
            if (userDoc.exists) {
                this.userData = userDoc.data();
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    async handleLogout() {
        try {
            await this.auth.signOut();
            this.showMessage('Logged out successfully.', 'success');
        } catch (error) {
            this.showMessage('Error logging out.', 'error');
        }
    }

    async resendVerification() {
        if (!this.currentUser) return;

        try {
            await this.currentUser.sendEmailVerification();
            this.showMessage('Verification email sent!', 'success');
        } catch (error) {
            this.showMessage('Error sending verification email.', 'error');
        }
    }

    handleAuthenticatedUser() {
        this.hideAllScreens();
        document.getElementById('dashboard-screen').classList.remove('hidden');
        document.getElementById('user-email').textContent = this.currentUser.email;
        
        // Initialize other modules
        if (window.sessionManager) {
            window.sessionManager.init();
        }
        if (window.leaderboardManager) {
            window.leaderboardManager.init();
        }
        if (window.geminiManager) {
            window.geminiManager.init();
        }
    }

    handleUnauthenticatedUser() {
        this.hideAllScreens();
        document.getElementById('auth-screen').classList.remove('hidden');
        this.clearForms();
    }

    showVerificationScreen() {
        this.hideAllScreens();
        document.getElementById('verification-screen').classList.remove('hidden');
    }

    showPaymentScreen() {
        this.hideAllScreens();
        document.getElementById('payment-screen').classList.remove('hidden');
    }

    showPaymentNotice() {
        document.getElementById('payment-notice').classList.remove('hidden');
    }

    showRegisterForm() {
        this.hideAllScreens();
        document.getElementById('auth-screen').classList.remove('hidden');
        this.switchTab('register');
        document.getElementById('payment-notice').classList.add('hidden');
    }

    showAuthScreen() {
        this.hideAllScreens();
        document.getElementById('auth-screen').classList.remove('hidden');
        this.switchTab('login');
    }

    hideAllScreens() {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => screen.classList.add('hidden'));
    }

    clearForms() {
        document.getElementById('login-form').reset();
        document.getElementById('register-form').reset();
        document.getElementById('auth-message').textContent = '';
        document.getElementById('auth-message').className = 'auth-message';
    }

    showMessage(message, type) {
        const messageEl = document.getElementById('auth-message');
        messageEl.textContent = message;
        messageEl.className = `auth-message ${type}`;
    }

    showLoading() {
        document.getElementById('loading-screen').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading-screen').classList.add('hidden');
    }

    getErrorMessage(error) {
        switch (error.code) {
            case 'auth/user-not-found':
                return 'No account found with this email address.';
            case 'auth/wrong-password':
                return 'Incorrect password.';
            case 'auth/email-already-in-use':
                return 'An account with this email already exists.';
            case 'auth/weak-password':
                return 'Password should be at least 6 characters.';
            case 'auth/invalid-email':
                return 'Invalid email address.';
            case 'auth/user-disabled':
                return 'This account has been disabled.';
            case 'auth/too-many-requests':
                return 'Too many failed attempts. Please try again later.';
            default:
                return 'An error occurred. Please try again.';
        }
    }

    // Public methods for other modules
    getCurrentUser() {
        return this.currentUser;
    }

    getUserData() {
        return this.userData;
    }

    async updateUserData(data) {
        if (!this.currentUser) return;

        try {
            await this.db.collection('users').doc(this.currentUser.uid).update({
                ...data,
                lastActive: firebase.firestore.FieldValue.serverTimestamp()
            });
            await this.loadUserData();
        } catch (error) {
            console.error('Error updating user data:', error);
        }
    }
}

// Initialize authentication manager
window.authManager = new AuthManager();
