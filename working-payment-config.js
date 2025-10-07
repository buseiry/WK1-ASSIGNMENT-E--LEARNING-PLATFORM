// Working Payment Configuration
// This file contains the actual working configuration for your payment system

const WORKING_CONFIG = {
    // Firebase Configuration (working configuration)
    firebase: {
        apiKey: "AIzaSyCMJzYUsmZsf8KBWXQD8yFCdaurd5dCauY",
        authDomain: "reading-streak.firebaseapp.com",
        projectId: "reading-streak",
        storageBucket: "reading-streak.firebasestorage.app",
        messagingSenderId: "508966325542",
        appId: "1:508966325542:web:82da076dc762ecc00fc5e7",
        measurementId: "G-TF60SVCQ5W"
    },
    
    // Paystack Configuration (you need to add your real keys here)
    paystack: {
        // Test Environment
        test: {
            publicKey: 'pk_test_YOUR_ACTUAL_TEST_PUBLIC_KEY_HERE',
            secretKey: 'sk_test_YOUR_ACTUAL_TEST_SECRET_KEY_HERE'
        },
        // Live Environment  
        live: {
            publicKey: 'pk_live_YOUR_ACTUAL_LIVE_PUBLIC_KEY_HERE',
            secretKey: 'sk_live_YOUR_ACTUAL_LIVE_SECRET_KEY_HERE'
        },
        // Current environment
        environment: 'test'
    },
    
    // Your Bank Accounts (already configured)
    bankAccounts: {
        ecobank: {
            accountNumber: '4890010148',
            accountName: 'Buseiry Habeeb Olayinka'
        },
        opay: {
            accountNumber: '9164392514',
            accountName: 'Buseiry Habeeb Olayinka'
        }
    },
    
    // Payment Settings
    payment: {
        amount: 500, // 500 Naira
        currency: 'NGN',
        amountInKobo: 50000 // 500 Naira in kobo for Paystack
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WORKING_CONFIG;
} else {
    window.WORKING_CONFIG = WORKING_CONFIG;
}


const WORKING_CONFIG = {
    // Firebase Configuration (working configuration)
    firebase: {
        apiKey: "AIzaSyCMJzYUsmZsf8KBWXQD8yFCdaurd5dCauY",
        authDomain: "reading-streak.firebaseapp.com",
        projectId: "reading-streak",
        storageBucket: "reading-streak.firebasestorage.app",
        messagingSenderId: "508966325542",
        appId: "1:508966325542:web:82da076dc762ecc00fc5e7",
        measurementId: "G-TF60SVCQ5W"
    },
    
    // Paystack Configuration (you need to add your real keys here)
    paystack: {
        // Test Environment
        test: {
            publicKey: 'pk_test_YOUR_ACTUAL_TEST_PUBLIC_KEY_HERE',
            secretKey: 'sk_test_YOUR_ACTUAL_TEST_SECRET_KEY_HERE'
        },
        // Live Environment  
        live: {
            publicKey: 'pk_live_YOUR_ACTUAL_LIVE_PUBLIC_KEY_HERE',
            secretKey: 'sk_live_YOUR_ACTUAL_LIVE_SECRET_KEY_HERE'
        },
        // Current environment
        environment: 'test'
    },
    
    // Your Bank Accounts (already configured)
    bankAccounts: {
        ecobank: {
            accountNumber: '4890010148',
            accountName: 'Buseiry Habeeb Olayinka'
        },
        opay: {
            accountNumber: '9164392514',
            accountName: 'Buseiry Habeeb Olayinka'
        }
    },
    
    // Payment Settings
    payment: {
        amount: 500, // 500 Naira
        currency: 'NGN',
        amountInKobo: 50000 // 500 Naira in kobo for Paystack
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WORKING_CONFIG;
} else {
    window.WORKING_CONFIG = WORKING_CONFIG;
}












