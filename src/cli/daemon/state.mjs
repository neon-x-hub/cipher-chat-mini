import { daemonClient } from "../../daemon/client.mjs";

async function checkState() {
    try {
        const state = await daemonClient.isDaemonRunning();
        console.log('Daemon state:', state ? '🔥 Running' : '💤 Not Running');
    } catch (error) {
        throw new Error(error.message);
    }

}

export { checkState };
