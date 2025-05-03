import { daemonClient } from "../../daemon/client.mjs";

async function stopDaemon() {
    try {
        const isRunning = await daemonClient.isDaemonRunning();
        if (!isRunning) {
            console.log('💤 Daemon is not running. No need to stop.');
            return;
        }
        await daemonClient.connect();
        console.log('Connected to daemon client. Stopping daemon...');
        await daemonClient.stopDaemon();
        console.log('✅ Daemon stopped successfully!');
    } catch (error) {
        throw new Error('Failed to stop daemon: ' + error.message);
    }
}

export { stopDaemon };
