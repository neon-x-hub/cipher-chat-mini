import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

export class ConfigProvider {
  constructor(configFilePath) {
    this.configFilePath = configFilePath || path.join(path.dirname(fileURLToPath(import.meta.url)), 'config.js');
    this.config = {};
  }

  // Load config from disk dynamically
  async load() {
    try {
      const configModule = await import(`${pathToFileURL(this.configFilePath)}?t=${Date.now()}`);
      this.config = configModule.default || {};
    } catch (err) {
      console.error(`Failed to load config: ${err.message}`);
      this.config = {};
    }
  }

  // Get a config value
  get(key) {
    return this.config[key];
  }

  // Set a config value
  set(key, value) {
    this.config[key] = value;
  }

  // Save config to disk (as ESM default export)
  async save() {
    const content = `export default ${JSON.stringify(this.config, null, 2)};\n`;
    await writeFile(this.configFilePath, content, 'utf8');
  }

  // Get all config as object
  getAll() {
    return { ...this.config };
  }

  // Reset config in memory
  reset() {
    this.config = {};
  }
}
