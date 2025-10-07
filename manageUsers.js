const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://reading-streak.firebaseio.com" // Updated with your project
});

const auth = admin.auth();

// List all users with their email and verification status
auth.listUsers()
  .then((listUsersResult) => {
    listUsersResult.users.forEach((userRecord) => {
      console.log(`User: ${userRecord.uid}, Email: ${userRecord.email}, Verified: ${userRecord.emailVerified}`);
    });
  })
  .catch((error) => {
    console.error("Error listing users:", error);
  });
