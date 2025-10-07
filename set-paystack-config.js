#!/usr/bin/env node
import readline from "readline";
import { spawn } from "child_process";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  try {
    const secretKey = await askQuestion("Enter your Paystack SECRET key (sk_xxx): ");
    const publicKey = await askQuestion("Enter your Paystack PUBLIC key (pk_xxx): ");

    rl.close();

    console.log("\nSaving Paystack keys to Firebase Functions secrets...");

    // Save secret key
    const secretProc = spawn("firebase", ["functions:secrets:set", "PAYSTACK_SECRET_KEY"], {
      stdio: ["pipe", "inherit", "inherit"]
    });
    secretProc.stdin.write(secretKey + "\n");
    secretProc.stdin.end();

    secretProc.on("close", (code) => {
      if (code === 0) {
        console.log("✅ Paystack SECRET key saved.");

        // Save public key
        const publicProc = spawn("firebase", ["functions:secrets:set", "PAYSTACK_PUBLIC_KEY"], {
          stdio: ["pipe", "inherit", "inherit"]
        });
        publicProc.stdin.write(publicKey + "\n");
        publicProc.stdin.end();

        publicProc.on("close", (code2) => {
          if (code2 === 0) {
            console.log("✅ Paystack PUBLIC key saved.");
            console.log("🎉 Both Paystack keys stored successfully in Firebase Functions!");
          } else {
            console.error("Failed to save PUBLIC key.");
          }
        });
      } else {
        console.error("Failed to save SECRET key.");
      }
    });
  } catch (error) {
    console.error("Something went wrong:", error);
    rl.close();
  }
}

main();


