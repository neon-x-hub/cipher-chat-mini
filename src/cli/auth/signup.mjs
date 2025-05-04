import { MatrixCommands } from "../../matrix/commands.mjs";
import readline from "readline";
import fs from "fs/promises";
import path from "path";

const CONFIG_PATH = path.resolve("src/state", "config.js");

function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans.trim());
    }));
}

async function promptSignupDetails() {
    const homeserverUrl = await askQuestion("Homeserver URL (e.g., http://localhost:8008): ");
    const username = await askQuestion("Desired Username: ");
    const password = await askQuestion("Desired Password: ");
    return { homeserverUrl, username, password };
}

async function signup({ homeserverUrl, username, password }) {
    try {
        // Perform signup (register user)
        const { accessToken, userId, deviceId } = await MatrixCommands.register({ homeserverUrl, username, password });

        console.log("\n✅ Signup successful!");
        console.log("User ID:", userId);
        console.log("Access Token:", accessToken);

        return {
            credentials: { homeserverUrl, userId: userId, accessToken: accessToken, deviceId: deviceId, useDaemon: true }
        };
    } catch (error) {
        console.error("\n❌ Signup failed:", error.message);

        process.exit(1);
    }
}

async function saveCredentialsToConfig(credentials) {
    const content = `module.exports = ${JSON.stringify(credentials, null, 2)};\n`;
    await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
    await fs.writeFile(CONFIG_PATH, content, "utf8");
    console.log(`\n✅ Credentials saved to ${CONFIG_PATH}`);
}

/**
 * Perform interactive signup and save config.
 *
 * @returns {Promise<{ credentials: Object }>}
 */
export async function interactiveSignup() {
    const signupDetails = await promptSignupDetails();
    const { credentials: savedCredentials } = await signup(signupDetails);

    await saveCredentialsToConfig(savedCredentials);

    process.stdin.resume();

    return { credentials: savedCredentials };
}

// If run directly (node src/signup.mjs), execute immediately
if (import.meta.url === `file://${process.argv[1]}`) {
    interactiveSignup().catch(err => {
        console.error("Fatal error:", err);
        process.exit(1);
    });
}
