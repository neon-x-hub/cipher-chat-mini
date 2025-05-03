import { daemonClient } from "../../daemon/client.mjs";
import { MatrixDaemon } from "../../daemon/service.mjs";
async function startDaemon() {
    try {
        const isRunning = await daemonClient.isDaemonRunning();

        if (isRunning) {
            console.log('🔥 Daemon is already running. No need to start.');
            return;
        }

        const daemon = new MatrixDaemon();
        daemon.start()


    } catch (error) {
        throw new Error("Daemon Error: " + error.message);
    }
}

export { startDaemon };
