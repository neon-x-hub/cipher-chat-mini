import fs from "fs/promises";
import path from "path";
import config from "../../state/config.js";

async function setDaemon(state) {
    const CONFIG_PATH = path.resolve("src/state", "config.js");
    async function saveConfig(configContent) {
        const content = `module.exports = ${JSON.stringify(configContent, null, 2)};\n`;
        await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
        await fs.writeFile(CONFIG_PATH, content, "utf8");
        console.log(`✅ Daemon Preference saved`);
    }

    try {
        // Disable the daemon in the config
        config.useDaemon = state;
        await saveConfig(config);
    } catch (error) {
        throw new Error("Failed to update daemon config: " + error.message);
    }
}

export { setDaemon };
