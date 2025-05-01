import { MatrixDaemon } from "../../daemon/service.mjs";

async function startDaemon() {
    console.log('Starting daemon...');
    const daemon = new MatrixDaemon();
    try {
        await daemon.start();
    } catch (error) {
        throw new Error("Daemon Error: " + error.message);
    }
}

export { startDaemon };
