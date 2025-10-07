// Gemini AI Integration Module
class GeminiManager {
    constructor() {
        this.isEnabled = false;
        this.apiKey = null;
        this.model = 'gemini-pro';
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add Gemini features to the dashboard
        this.addGeminiFeatures();
    }

    async init() {
        try {
            // Check if Gemini is available
            if (typeof google !== 'undefined' && google.generativeai) {
                this.isEnabled = true;
                this.setupGeminiAPI();
                this.showGeminiFeatures();
            } else {
                console.log('Gemini AI not available - loading script...');
                await this.loadGeminiScript();
            }
        } catch (error) {
            console.error('Error initializing Gemini:', error);
        }
    }

    async loadGeminiScript() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_GEMINI_API_KEY';
            script.onload = () => {
                this.isEnabled = true;
                this.setupGeminiAPI();
                this.showGeminiFeatures();
                resolve();
            };
            script.onerror = () => {
                console.log('Gemini AI script failed to load');
                reject();
            };
            document.head.appendChild(script);
        });
    }

    setupGeminiAPI() {
        if (typeof google !== 'undefined' && google.generativeai) {
            this.genAI = google.generativeai;
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
        }
    }

    showGeminiFeatures() {
        // Add Gemini features to the dashboard
        this.addReadingInsights();
        this.addPersonalizedRecommendations();
        this.addSmartSessionAnalysis();
    }

    addReadingInsights() {
        const leaderboardSection = document.querySelector('.leaderboard-section');
        if (leaderboardSection) {
            const insightsContainer = document.createElement('div');
            insightsContainer.className = 'gemini-insights';
            insightsContainer.innerHTML = `
                <h3><i class="fas fa-brain"></i> AI Reading Insights</h3>
                <div class="insights-content">
                    <div class="insight-card">
                        <h4>Reading Pattern Analysis</h4>
                        <p id="reading-pattern">Analyzing your reading patterns...</p>
                    </div>
                    <div class="insight-card">
                        <h4>Personalized Tips</h4>
                        <p id="reading-tips">Generating personalized reading tips...</p>
                    </div>
                    <div class="insight-card">
                        <h4>Goal Recommendations</h4>
                        <p id="reading-goals">Suggesting reading goals...</p>
                    </div>
                </div>
            `;
            leaderboardSection.appendChild(insightsContainer);
        }
    }

    addPersonalizedRecommendations() {
        const sessionControl = document.querySelector('.session-control');
        if (sessionControl) {
            const recommendationsContainer = document.createElement('div');
            recommendationsContainer.className = 'gemini-recommendations';
            recommendationsContainer.innerHTML = `
                <div class="recommendation-card">
                    <h4><i class="fas fa-lightbulb"></i> AI Recommendations</h4>
                    <div id="ai-recommendations">
                        <p>Loading personalized recommendations...</p>
                    </div>
                    <button id="refresh-recommendations" class="btn btn-secondary btn-sm">
                        <i class="fas fa-refresh"></i> Refresh
                    </button>
                </div>
            `;
            sessionControl.appendChild(recommendationsContainer);

            // Add event listener for refresh button
            document.getElementById('refresh-recommendations').addEventListener('click', () => {
                this.generateRecommendations();
            });
        }
    }

    addSmartSessionAnalysis() {
        const sessionControl = document.querySelector('.session-control');
        if (sessionControl) {
            const analysisContainer = document.createElement('div');
            analysisContainer.className = 'gemini-analysis';
            analysisContainer.innerHTML = `
                <div class="analysis-card">
                    <h4><i class="fas fa-chart-line"></i> Session Analysis</h4>
                    <div id="session-analysis">
                        <p>AI will analyze your session when you complete it...</p>
                    </div>
                </div>
            `;
            sessionControl.appendChild(analysisContainer);
        }
    }

    async generateRecommendations() {
        if (!this.isEnabled || !this.model) {
            this.showMessage('Gemini AI not available', 'warning');
            return;
        }

        try {
            const userData = window.authManager.getUserData();
            const prompt = `
                Based on the following reading session data, provide personalized recommendations:
                
                User Points: ${userData?.points || 0}
                Current Rank: ${userData?.rank || 'Unknown'}
                Session Status: ${document.getElementById('session-status').textContent}
                
                Please provide:
                1. Reading tips to improve focus
                2. Suggested reading goals
                3. Motivation to continue reading
                
                Keep the response concise and encouraging.
            `;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            document.getElementById('ai-recommendations').innerHTML = `
                <div class="recommendation-content">
                    ${this.formatRecommendations(text)}
                </div>
            `;
        } catch (error) {
            console.error('Error generating recommendations:', error);
            document.getElementById('ai-recommendations').innerHTML = `
                <p>Unable to generate recommendations at this time.</p>
            `;
        }
    }

    async analyzeSession(sessionData) {
        if (!this.isEnabled || !this.model) {
            return;
        }

        try {
            const prompt = `
                Analyze this reading session and provide insights:
                
                Duration: ${sessionData.durationMinutes} minutes
                Points Earned: ${sessionData.pointsEarned}
                Completion Status: ${sessionData.completed ? 'Completed' : 'Incomplete'}
                
                Provide:
                1. Performance analysis
                2. Areas for improvement
                3. Encouragement and motivation
                
                Keep it positive and constructive.
            `;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            document.getElementById('session-analysis').innerHTML = `
                <div class="analysis-content">
                    ${this.formatAnalysis(text)}
                </div>
            `;
        } catch (error) {
            console.error('Error analyzing session:', error);
        }
    }

    formatRecommendations(text) {
        // Format the AI response into readable HTML
        const lines = text.split('\n').filter(line => line.trim());
        let html = '';
        
        lines.forEach(line => {
            if (line.match(/^\d+\./)) {
                html += `<div class="recommendation-item">${line}</div>`;
            } else if (line.trim()) {
                html += `<p>${line}</p>`;
            }
        });
        
        return html || `<p>${text}</p>`;
    }

    formatAnalysis(text) {
        // Format the AI analysis into readable HTML
        const lines = text.split('\n').filter(line => line.trim());
        let html = '';
        
        lines.forEach(line => {
            if (line.match(/^\d+\./)) {
                html += `<div class="analysis-item">${line}</div>`;
            } else if (line.trim()) {
                html += `<p>${line}</p>`;
            }
        });
        
        return html || `<p>${text}</p>`;
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

    // Public methods
    isGeminiEnabled() {
        return this.isEnabled;
    }

    async generateReadingInsights() {
        await this.generateRecommendations();
    }

    async analyzeCompletedSession(sessionData) {
        await this.analyzeSession(sessionData);
    }
}

// Initialize Gemini manager
window.geminiManager = new GeminiManager();







