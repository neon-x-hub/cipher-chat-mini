import config from "../../state/config.js";

function getDaemonConfig() {
    if (!config) {
        throw new Error("❌ No configuration found. Please run the login command first.");
    }
    console.log('✨ Current Daemon Config: ', config.useDaemon ? "👍 In Use" : "😪 Not Being Used");
}

export { getDaemonConfig }
