// Leaderboard Management Module
class LeaderboardManager {
    constructor() {
        this.db = window.firebaseDb;
        this.auth = window.firebaseAuth;
        this.leaderboardData = [];
        this.userRank = null;
        this.leaderboardListener = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // No specific event listeners needed for leaderboard
    }

    async init() {
        await this.loadLeaderboard();
        this.setupRealTimeListener();
        this.updateUserStats();
    }

    async loadLeaderboard() {
        try {
            // Load top 10 users by points
            const snapshot = await this.db
                .collection('users')
                .orderBy('points', 'desc')
                .orderBy('createdAt', 'asc') // Secondary sort for consistent ranking
                .limit(10)
                .get();

            this.leaderboardData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            this.renderLeaderboard();
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            this.showError('Failed to load leaderboard');
        }
    }

    setupRealTimeListener() {
        // Set up real-time listener for leaderboard updates
        this.leaderboardListener = this.db
            .collection('users')
            .orderBy('points', 'desc')
            .orderBy('createdAt', 'asc')
            .limit(10)
            .onSnapshot((snapshot) => {
                this.leaderboardData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                this.renderLeaderboard();
                this.updateUserStats();
            }, (error) => {
                console.error('Error in leaderboard listener:', error);
            });
    }

    renderLeaderboard() {
        const leaderboardList = document.getElementById('leaderboard-list');
        
        if (this.leaderboardData.length === 0) {
            leaderboardList.innerHTML = `
                <div class="loading-placeholder">
                    <i class="fas fa-trophy"></i>
                    <p>No users yet. Be the first to start reading!</p>
                </div>
            `;
            return;
        }

        const currentUser = window.authManager.getCurrentUser();
        const currentUserId = currentUser ? currentUser.uid : null;

        leaderboardList.innerHTML = this.leaderboardData.map((user, index) => {
            const rank = index + 1;
            const isCurrentUser = user.id === currentUserId;
            
            return `
                <div class="leaderboard-item ${isCurrentUser ? 'current-user' : ''}">
                    <div class="rank-number ${rank <= 3 ? 'top-3' : 'other'}">
                        ${rank}
                    </div>
                    <div class="user-info-leaderboard">
                        <div class="user-email-leaderboard">
                            ${this.maskEmail(user.email)}
                            ${isCurrentUser ? '<i class="fas fa-user"></i>' : ''}
                        </div>
                        <div class="user-points-leaderboard">
                            ${user.points} point${user.points !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    async updateUserStats() {
        const currentUser = window.authManager.getCurrentUser();
        if (!currentUser) return;

        try {
            // Get user's current data
            const userDoc = await this.db.collection('users').doc(currentUser.uid).get();
            if (!userDoc.exists) return;

            const userData = userDoc.data();
            
            // Calculate rank
            const rankSnapshot = await this.db
                .collection('users')
                .where('points', '>', userData.points)
                .get();
            
            const rank = rankSnapshot.size + 1;

            // Update UI
            document.getElementById('user-points').textContent = userData.points;
            document.getElementById('user-rank').textContent = rank;

            // Update user document with rank
            await this.db.collection('users').doc(currentUser.uid).update({
                rank: rank,
                lastActive: firebase.firestore.FieldValue.serverTimestamp()
            });

        } catch (error) {
            console.error('Error updating user stats:', error);
        }
    }

    maskEmail(email) {
        if (!email) return '';
        
        const [localPart, domain] = email.split('@');
        if (localPart.length <= 2) {
            return email;
        }
        
        const maskedLocal = localPart.charAt(0) + '*'.repeat(localPart.length - 2) + localPart.charAt(localPart.length - 1);
        return `${maskedLocal}@${domain}`;
    }

    async refreshLeaderboard() {
        await this.loadLeaderboard();
        this.updateUserStats();
    }

    showError(message) {
        const leaderboardList = document.getElementById('leaderboard-list');
        leaderboardList.innerHTML = `
            <div class="loading-placeholder">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
            </div>
        `;
    }

    // Public methods
    getLeaderboardData() {
        return this.leaderboardData;
    }

    getUserRank() {
        return this.userRank;
    }

    destroy() {
        if (this.leaderboardListener) {
            this.leaderboardListener();
            this.leaderboardListener = null;
        }
    }
}

// Initialize leaderboard manager
window.leaderboardManager = new LeaderboardManager();







