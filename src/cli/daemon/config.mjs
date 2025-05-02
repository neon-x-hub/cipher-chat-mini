import config from "../../state/config.js";

function getDaemonConfig() {
    console.log('✨ Current Daemon Config: ', config.useDaemon ? "👍 In Use" : "😪 Not Being Used");
}

export { getDaemonConfig }
