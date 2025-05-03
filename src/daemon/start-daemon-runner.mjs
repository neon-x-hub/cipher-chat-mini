import { startDaemon } from "../cli/daemon/start.mjs";
startDaemon().then(() => {
    console.log("Daemon started successfully!");
}).catch((error) => {
    console.error("Daemon failed to start:", error.message);
    process.exit(1);
})
