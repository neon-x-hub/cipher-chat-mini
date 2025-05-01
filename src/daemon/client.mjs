import IPC from 'node-ipc';
import { randomUUID } from 'crypto';

/**
 * * DaemonClient class to handle IPC communication with the matrix daemon.
 * * @class DaemonClient
 * * @description This class sets up an IPC client to communicate with the matrix daemon for executing commands.
 * * @property {IPC.IPC} ipc - Instance of the IPC client for inter-process communication.
 * * @property {boolean} connected - Flag to indicate if the client is connected to the matrix daemon.
 * * @property {Promise} connecting - Promise that resolves when the client is connected to the daemon.
 * * @method connect - Establishes a connection to the matrix daemon.
 * * @method sendCommand - Sends a command to the matrix daemon and waits for a response.
 * * @method execute - Executes a command on the matrix daemon.
 * * @method disconnect - Disconnects from the matrix daemon and cleans up listeners.
 * * @returns {Promise<void>} - A promise that resolves when the connection is successfully established.
 */
export class DaemonClient {
    constructor() {
        this.ipc = new IPC.IPC();
        this.ipc.config.id = `matrix_client_${process.pid}`;
        this.ipc.config.retry = 1500;
        this.ipc.config.silent = true;
        this.connecting = null;
        this.connected = false;
    }

    /**
     * Establish a connection to the matrix daemon via IPC.
     *
     * If the client is already connected, the function returns immediately.
     * If a connection attempt is already in progress, it returns the ongoing promise.
     *
     * @returns {Promise<void>} - A promise that resolves when the connection is successfully established.
     *                            If the connection fails, the promise is rejected with the error.
     */

    async connect() {
        if (this.connected) return;
        if (this.connecting) return this.connecting;

        this.connecting = new Promise((resolve, reject) => {
            this.ipc.connectTo('matrix_daemon', () => {
                this.ipc.of.matrix_daemon.on('connect', () => {
                    this.connected = true;
                    console.log('Connected to matrix daemon');

                    resolve();
                });
                this.ipc.of.matrix_daemon.on('error', (err) => {
                    this.connecting = null;
                    reject(err);
                });
            });
        });

        return this.connecting;
    }

    /**
     * Send a command to the matrix daemon and wait for a response.
     *
     * This function first ensures a connection to the daemon is established.
     * Then it sends the command to the daemon and waits for a response.
     *
     * If the response is successful, the promise resolves with the response data.
     * If the response is an error or the daemon doesn't respond within 10 seconds, the promise is rejected with the error.
     *
     * @param {string} action - The action/operation to perform on the daemon.
     * @param {Object} [params={}] - Parameters for the action.
     * @returns {Promise<Object>} - A promise that resolves with the response data or rejects with an error.
     */
    async sendCommand(action, params = {}) {
        await this.connect();

        return new Promise((resolve, reject) => {
            const requestId = randomUUID();

            let isStream = action === 'streamMessages';
            let resolved = false;

            const handler = (response) => {
                if (!response || response.requestId !== requestId) return;

                if (response.success) {
                    if (isStream) {
                        // Stream message received
                        params.callback(response.data);

                        if (!resolved) {
                            resolve(); // resolve once to avoid timeout rejection
                            resolved = true;
                        }

                    } else {
                        this.ipc.of.matrix_daemon.off('response', handler);
                        resolve(response.data);
                    }
                } else {
                    this.ipc.of.matrix_daemon.off('response', handler);
                    reject(new Error(response.error));
                }
            };

            this.ipc.of.matrix_daemon.on('response', handler);

            this.ipc.of.matrix_daemon.emit('command', {
                requestId,
                action,
                params
            });

            // Timeout only for non-streaming commands
            if (!isStream) {
                setTimeout(() => {
                    this.ipc.of.matrix_daemon.off('response', handler);
                    reject(new Error(`Timeout waiting for response to command: ${action}`));
                }, 10000);
            }
        });
    }

    /**
     * Execute a command on the matrix daemon.
     *
     * This function ensures a connection to the daemon is established and then
     * sends the specified command with parameters to be executed.
     *
     * @param {string} action - The action or command to execute on the daemon.
     * @param {Object} params - The parameters to pass along with the action.
     * @returns {Promise<Object>} - A promise that resolves with the result of the command execution.
     */

    async execute(action, params) {
        return this.sendCommand(action, params);
    }


    /**
     * Disconnect from the matrix daemon.
     *
     * This function ensures a disconnection from the daemon is established.
     * It first removes all listeners from the daemon connection, then disconnects
     * from the daemon and sets the connected state to false.
     *
     * @returns {Promise<void>} - A promise that resolves when the disconnection is complete.
     */
    disconnect() {
        return new Promise((resolve) => {
            if (!this.connected || !this.ipc.of.matrix_daemon) {
                return resolve();
            }

            // Clean up listeners
            this.ipc.of.matrix_daemon.removeAllListeners();

            // Disconnect from the daemon
            this.ipc.disconnect('matrix_daemon');

            this.connected = false;
            this.connecting = null;

            // Slight delay to ensure disconnect finishes before resolving
            setTimeout(() => resolve(), 100);
        });
    }


}

export const daemonClient = new Proxy(new DaemonClient(), {
    get(target, prop) {
        if (prop in target || ['then', 'catch', 'finally', Symbol.toStringTag].includes(prop)) {
            return target[prop];
        }
        return (params = {}) => target.execute(prop, params);
    }
});
