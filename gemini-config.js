// Gemini AI Configuration
// Replace with your actual Gemini API key

const GEMINI_CONFIG = {
    apiKey: 'AIzaSyBgwWcWSiez1kC5TO1BOU2_tAvoJi379dQ', // Your Gemini API key
    model: 'gemini-pro',
    features: {
        readingInsights: true,
        personalizedRecommendations: true,
        sessionAnalysis: true,
        goalSuggestions: true
    },
    prompts: {
        readingTips: `
            Based on the user's reading session data, provide personalized reading tips:
            - User Points: {points}
            - Current Rank: {rank}
            - Session Status: {status}
            
            Provide 3-5 concise, actionable tips to improve reading focus and consistency.
        `,
        sessionAnalysis: `
            Analyze this reading session and provide insights:
            - Duration: {duration} minutes
            - Points Earned: {points}
            - Completion Status: {completed}
            
            Provide:
            1. Performance analysis
            2. Areas for improvement
            3. Encouragement and motivation
            
            Keep it positive and constructive.
        `,
        goalRecommendations: `
            Based on the user's reading history, suggest personalized goals:
            - Total Points: {points}
            - Current Rank: {rank}
            - Reading Pattern: {pattern}
            
            Suggest 2-3 achievable reading goals with specific targets.
        `
    }
};

// Instructions for getting Gemini API Key:
// 1. Go to https://makersuite.google.com/app/apikey
// 2. Create a new API key
// 3. Copy the key and replace 'YOUR_GEMINI_API_KEY' above
// 4. Update the script tag in index.html with your actual key

window.GEMINI_CONFIG = GEMINI_CONFIG;
