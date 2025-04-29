import * as sdk from "matrix-js-sdk";
import { logger as Logger } from "matrix-js-sdk/lib/logger.js";

import config from "../state/config.js";

// Disable ALL matrix-js-sdk logging// Completely replace the logger with a no-op implementation
const noop = () => { };
Logger.error = noop;
Logger.warn = noop;
Logger.info = noop;
Logger.debug = noop;
Logger.trace = noop;

// ⚡ SILENCE ALL MATRIX LOGS (including debug/trace)
Logger.setLevel(Logger.levels.SILENT); // No more logs!


let client = null;
let initializing = null; // prevent double initialization

async function getClient() {
    if (client) {
        return client; // Already ready
    }

    if (initializing) {
        return initializing; // Wait if already initializing
    }

    initializing = (async () => {


        if (!config || !config.homeserverUrl || !config.accessToken) {
            throw new Error("Matrix client config is missing. Please login first.");
        }

        console.log("Initializing Matrix client...");


        client = sdk.createClient({
            baseUrl: config.homeserverUrl,
            accessToken: config.accessToken,
            userId: config.userId,
            logger: null
        });

        // Wait for sync if not started yet
        await new Promise((resolve, reject) => {
            client.once('sync', (state) => {
                if (state === 'PREPARED') {
                    console.log("Client initialized successfully and synced.");
                    resolve();  // Resolve when client is prepared
                } else {
                    console.log(`Client sync state: ${state}`);
                }
            });
            client.once('error', (error) => {
                console.error("Client initialization failed:", error);
                reject(error);  // Reject if there's an error in sync
            });

            client.startClient();  // Starts the sync process
        });

        return client;
    })();

    return initializing;
}

function resetClient() {
    if (client) {
        client.stopClient();
    }
    client = null;
    initializing = null;
}

export { getClient, resetClient };
