import { MatrixCommands } from './commands.mjs';
import config from '../state/config.js';

// Matrix client
import {
    MatrixClient,
    SimpleFsStorageProvider,
    AutojoinRoomsMixin,
    LogService
} from 'matrix-bot-sdk';

// Daemon client
import { daemonClient, DaemonClient } from '../daemon/client.mjs';

/**
 * * MatrixClientProxy class to handle direct and daemon commands.
 * @class MatrixClientProxy
 * @description This class acts as a proxy to either the direct Matrix client or the daemon client based on the configuration.
 * @property {MatrixCommands} directCommands - Instance of the MatrixCommands class for direct commands.
 * @property {string} mode - The mode of operation, either 'daemon' or 'direct'.
 * @method getCommands - Returns the appropriate commands instance based on the mode.
 * @method execute - Executes a command based on the action and parameters provided.
 */
export class MatrixClientProxy {
    constructor() {
        this.directCommands = null;
        this._mode = config.useDaemon ? 'daemon' : 'direct';
    }

    /**
     * Initializes a direct Matrix client instance.
     *
     * @async
     * @private
     * @returns {Promise<MatrixClient>} - A promise that resolves with the initialized Matrix client instance.
     * @throws {Error} - Throws an error if the client fails to initialize.
     *
     * @description
     * This function creates a Matrix client using the provided configuration parameters.
     * It sets up an error handler for client errors and starts the client with lazy loading of members.
     * The client is considered initialized when it reaches the 'PREPARED' sync state.
     */
    async _createDirectClient() {
        // Initialize storage provider for syncing state
        const storage = new SimpleFsStorageProvider("../state/storage.json");

        // Create the client
        const client = new MatrixClient(
            config.homeserverUrl,
            config.accessToken,
            storage
        );

        // Optional: Auto-join rooms if you want similar behavior to syncing
        AutojoinRoomsMixin.setupOnClient(client);

        try {
            // Start syncing
            await client.start();
            console.log("Matrix bot client is ready and syncing.");
        } catch (error) {
            console.error("Failed to initialize Matrix bot client:", error);
            throw new Error("Client initialization failed");
        }

        return client;
    }



    /**
     * Retrieves the appropriate commands instance based on the current mode.
     *
     * @async
     * @returns {Promise<MatrixCommands|DaemonClient>} - A promise that resolves with either the daemon client or direct commands instance.
     *
     * @description
     * If the mode is 'daemon', it connects to the daemon client and returns it.
     * Otherwise, it initializes a direct Matrix client and returns a new instance of MatrixCommands.
     * The function ensures the direct commands are initialized only once.
     */

    async getCommands() {
        if (this.mode === 'daemon') {
            return daemonClient;
        }

        if (!this.directCommands) {

            const client = await this._createDirectClient();

            this.directCommands = new MatrixCommands(client);
        }

        return this.directCommands;
    }

    /**
     * Executes a command based on the action and parameters provided.
     *
     * @async
     * @param {string} action - The action to execute.
     * @param {Object} [params={}] - The parameters to pass to the action.
     * @returns {Promise<*>} - A promise that resolves with the result of the executed action.
     *
     * @description
     * Retrieves the appropriate commands instance based on the current mode and executes the specified action with the given parameters.
     */
    async execute(action, params = {}) {

        const commands = await this.getCommands();

        const result = commands[action](params);

        return result;

    }

    /**
     * Retrieves the current mode of operation.
     *
     * @returns {string} - The mode of operation, either 'daemon' or 'direct', based on the configuration.
     */

    get mode() {
        return config.useDaemon ? 'daemon' : 'direct';
    }

    /**
     * Sets the mode of operation.
     *
     * @param {"daemon" | "direct"} value - The mode of operation, either 'daemon' or 'direct'.
     * @description
     * Sets the mode of operation, which determines whether to use the daemon client or direct Matrix client.
     * If the value is 'daemon', the daemon client is used; otherwise the direct Matrix client is used.
     */
    set mode(value) {
        this._mode = value;
    }

}

export const clientProxy = new Proxy(new MatrixClientProxy(), {
    get(target, prop) {
        if (prop in target) return target[prop];
        return (params = {}) => target.execute(prop, params);
    }
});
