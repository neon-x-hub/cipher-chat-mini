import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

export class ConfigProvider {
    constructor(configFilePath) {
        this.configFilePath = configFilePath || path.join(path.dirname(fileURLToPath(import.meta.url)), 'config.js');
        this.config = {};
    }

    /**
     * Loads the configuration from the file specified in the constructor.
     * The configuration is loaded using ES modules import syntax to ensure
     * that the configuration is loaded as ESM (not CommonJS) and that the
     * "default" export is used as the configuration object.
     *
     * If the configuration cannot be loaded, this function will log an
     * error message to the console and set the configuration object to an
     * empty object.
     */
    async load() {
        try {
            const configModule = await import(`${pathToFileURL(this.configFilePath)}?t=${Date.now()}`);
            this.config = configModule.default || {};
        } catch (err) {
            console.error(`Failed to load config: ${err.message}`);
            this.config = {};
        }
    }

    /**
     * Retrieves the value associated with the specified key from the configuration.
     *
     * @param {string} key - The key whose associated value is to be returned.
     * @returns {*} - The value associated with the specified key, or undefined if the key does not exist in the configuration.
     */
    get(key) {
        return this.config[key];
    }

    /**
     * Sets the value for a specified key in the configuration.
     *
     * @param {string} key - The key for which the value needs to be set.
     * @param {*} value - The value to be associated with the specified key.
     */
    set(key, value) {
        this.config[key] = value;
    }

    /**
     * Saves the current configuration to the file specified in the constructor.
     * The configuration is serialized as a JSON string and exported as the default export.
     *
     * @async
     * @throws {Error} If the file cannot be written.
     */
    async save() {
        const content = `export default ${JSON.stringify(this.config, null, 2)};\n`;
        await writeFile(this.configFilePath, content, 'utf8');
    }

    /**
     * Retrieves a copy of the entire configuration object.
     *
     * @returns {Object} - A shallow copy of the configuration object.
     */
    getAll() {
        return { ...this.config };
    }

    /**
     * Resets the configuration object to an empty object.
     *
     * @throws {Error} If the configuration object is not empty.
     */
    reset() {
        this.config = {};
    }
}
