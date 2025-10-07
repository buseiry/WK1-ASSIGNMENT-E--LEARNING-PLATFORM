const admin = require("firebase-admin");

// Use your service account key JSON file
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com"
});

const auth = admin.auth();

// Replace with the UID of the user you want to send email verification
const uid = "USER_UID";

auth.getUser(uid)
  .then((userRecord) => {
    console.log(`User found: ${userRecord.email}`);
    console.log("Firebase Admin SDK cannot send verification emails directly.");
    console.log("You need to trigger email verification in frontend.");
  })
  .catch((error) => {
    console.error("Error fetching user:", error);
  });
