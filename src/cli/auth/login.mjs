import * as sdk from "matrix-js-sdk";
import { logger as Logger } from 'matrix-js-sdk/lib/logger.js';
Logger.setLevel(Logger.levels.SILENT);
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

async function promptCredentials() {
    const homeserverUrl = await askQuestion("Homeserver URL (e.g., http://localhost:8008): ");
    const username = await askQuestion("Username: ");
    const password = await askQuestion("Password: ");
    return { homeserverUrl, username, password };
}

async function login({ homeserverUrl, username, password }) {
    const client = sdk.createClient({ baseUrl: homeserverUrl });

    try {
        const { access_token, user_id, device_id } = await client.login("m.login.password", {
            user: username,
            password,
        });

        console.log("\n✅ Login successful!");
        console.log("User ID:", user_id);
        console.log("Access Token:", access_token);

        client.setAccessToken(access_token);

        return {
            client,
            credentials: { homeserverUrl, userId: user_id, accessToken: access_token, deviceId: device_id, useDaemon: true }
        };
    } catch (error) {
        console.error("\n❌ Login failed:", error.message);
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
 * Perform interactive login and save config.
 *
 * @returns {Promise<{ client: MatrixClient, credentials: Object }>}
 */
export async function interactiveLogin() {
    const credentials = await promptCredentials();
    const { client, credentials: savedCredentials } = await login(credentials);

    await saveCredentialsToConfig(savedCredentials);

    client.startClient();

    process.stdin.resume();

    return { client, credentials: savedCredentials };
}

// If run directly (node src/login.mjs), execute immediately
if (import.meta.url === `file://${process.argv[1]}`) {
    interactiveLogin().catch(err => {
        console.error("Fatal error:", err);
        process.exit(1);
    });
}
