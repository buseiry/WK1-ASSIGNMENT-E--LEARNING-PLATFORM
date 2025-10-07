// Main Application Module
class App {
    constructor() {
        this.db = window.firebaseDb;
        this.auth = window.firebaseAuth;
        this.functions = window.firebaseFunctions;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            // Wait for Firebase to be ready
            await this.waitForFirebase();
            
            // Initialize error handling
            this.setupErrorHandling();
            
            // Initialize global event listeners
            this.setupGlobalEventListeners();
            
            // Initialize message system
            this.setupMessageSystem();
            
            this.isInitialized = true;
            console.log('App initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    async waitForFirebase() {
        return new Promise((resolve) => {
            const checkFirebase = () => {
                if (window.firebaseAuth && window.firebaseDb && window.firebaseFunctions) {
                    resolve();
                } else {
                    setTimeout(checkFirebase, 100);
                }
            };
            checkFirebase();
        });
    }

    setupErrorHandling() {
        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.showError('An unexpected error occurred. Please refresh the page.');
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.showError('An unexpected error occurred. Please refresh the page.');
        });
    }

    setupGlobalEventListeners() {
        // Error modal handlers
        document.getElementById('close-error-modal').addEventListener('click', () => {
            this.hideErrorModal();
        });

        document.getElementById('error-modal-ok').addEventListener('click', () => {
            this.hideErrorModal();
        });

        // Click outside modal to close
        document.getElementById('error-modal').addEventListener('click', (e) => {
            if (e.target.id === 'error-modal') {
                this.hideErrorModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideErrorModal();
            }
        });
    }

    setupMessageSystem() {
        // Add message styles to head if not already present
        if (!document.querySelector('#message-styles')) {
            const style = document.createElement('style');
            style.id = 'message-styles';
            style.textContent = `
                .message {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    max-width: 400px;
                    padding: 1rem;
                    border-radius: 0.5rem;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                    animation: slideInRight 0.3s ease-out;
                }
                
                .message-success {
                    background: #d1fae5;
                    color: #065f46;
                    border: 1px solid #a7f3d0;
                }
                
                .message-error {
                    background: #fee2e2;
                    color: #991b1b;
                    border: 1px solid #fca5a5;
                }
                
                .message-info {
                    background: #dbeafe;
                    color: #1e40af;
                    border: 1px solid #93c5fd;
                }
                
                .message-content {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @media (max-width: 768px) {
                    .message {
                        top: 10px;
                        right: 10px;
                        left: 10px;
                        max-width: none;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    showError(message) {
        const errorModal = document.getElementById('error-modal');
        const errorMessage = document.getElementById('error-message');
        
        errorMessage.textContent = message;
        errorModal.classList.remove('hidden');
    }

    hideErrorModal() {
        document.getElementById('error-modal').classList.add('hidden');
    }

    showMessage(message, type = 'info') {
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.innerHTML = `
            <div class="message-content">
                <i class="fas fa-${this.getMessageIcon(type)}"></i>
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

    getMessageIcon(type) {
        switch (type) {
            case 'success':
                return 'check-circle';
            case 'error':
                return 'exclamation-circle';
            case 'warning':
                return 'exclamation-triangle';
            default:
                return 'info-circle';
        }
    }

    // Utility methods
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    // Public methods for other modules
    getDb() {
        return this.db;
    }

    getAuth() {
        return this.auth;
    }

    getFunctions() {
        return this.functions;
    }

    isReady() {
        return this.isInitialized;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
// Export for use in other modules
window.App = App;








