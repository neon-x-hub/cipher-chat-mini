import IPC from 'node-ipc';
import { randomUUID } from 'crypto';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

                const daemon = this.ipc.of.matrix_daemon;

                const onConnect = () => {
                    this.connected = true;
                    this.connecting = null;
                    console.log('✅ Connected to matrix daemon');
                    cleanup();
                    resolve();
                };

                const onError = async (err) => {
                    cleanup();
                    this.connecting = null;


                    if (err.code === 'ENOENT') {
                        console.log('💤 Daemon not running. Starting daemon...');
                        await this.startDaemonProcess();

                        // Retry connection after small delay
                        setTimeout(() => {
                            this.connect().then(resolve).catch(reject);
                        }, 800);
                    } else {
                        reject(err);
                    }
                };

                const cleanup = () => {
                    daemon.off('connect', onConnect);
                    daemon.off('error', onError);
                };

                daemon.on('connect', onConnect);
                daemon.on('error', onError);
            });

        });

        return this.connecting;
    }



    /**
     * Starts the matrix daemon process in detached mode.
     *
     * This function is called if the daemon is not running when we try to connect to it.
     * It runs the start-daemon-runner.mjs script in a detached Node.js process.
     *
     * @private
     * @returns {Promise<void>} - A promise that resolves when the daemon process has been started.
     */
    async startDaemonProcess() {

        const runnerPath = path.resolve(__dirname, './start-daemon-runner.mjs');

        const child = spawn(process.execPath, [runnerPath], {
            detached: true,
            stdio: 'ignore', // Don't tie up parent's stdio
        });

        child.unref(); // Allow parent to exit independently
    }

    /**
     * Checks if the matrix daemon is currently running.
     *
     * Attempts to establish a connection to the matrix daemon via IPC. If the connection
     * is successful, the daemon is considered running. If an ENOENT error is encountered,
     * it indicates that the daemon is not running, and the promise is rejected with `false`.
     * Other connection errors result in rejection with a detailed error message. If the
     * connection attempt times out, the promise is rejected with a timeout error.
     *
     * @returns {Promise<boolean>} - A promise that resolves with `true` if the daemon is running,
     *                               or rejects with `false` or an error if not.
     */
    async isDaemonRunning() {
        return new Promise((resolve, reject) => {
            // Clean up any existing connection first
            this.ipc.disconnect('matrix_daemon');

            const cleanup = () => {
                clearTimeout(timeout);
                this.ipc.disconnect('matrix_daemon');
                if (daemon) {
                    daemon.off('connect', onConnect);
                    daemon.off('error', onError);
                }
            };

            let daemon;
            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error('⌚ Daemon state check timed out.'));
            }, 3000);

            const onConnect = () => {
                cleanup();
                resolve(true);
            };

            const onError = (err) => {
                cleanup();
                if (err.code === 'ENOENT') {
                    resolve(false);
                } else {
                    reject(new Error('Daemon connection error: ' + err.message));
                }
            };

            this.ipc.connectTo('matrix_daemon', () => {
                daemon = this.ipc.of.matrix_daemon;
                daemon.on('connect', onConnect);
                daemon.on('error', onError);
            });
        });
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
        await this.connect(); // works properly

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

            // Clean up listeners on the underlying socket (if exists)
            if (this.ipc.of.matrix_daemon.socket) {
                this.ipc.of.matrix_daemon.socket.removeAllListeners();
            }
            // Disconnect from the daemon
            this.ipc.disconnect('matrix_daemon');

            this.connected = false;
            this.connecting = null;

            // Slight delay to ensure disconnect finishes before resolving
            setTimeout(() => resolve(), 100);
        });
    }

    /**
     * Stops the matrix daemon.
     *
     * This function sends a request to the daemon to stop and waits for confirmation.
     * If the daemon confirms it has stopped, this function disconnects from the daemon
     * and resolves the promise. If the daemon does not respond within 3 seconds, the
     * promise is rejected with an error.
     *
     * @returns {Promise<void>} - A promise that resolves when the daemon has stopped.
     * @throws {Error} - If not connected to the daemon.
     */
    async stopDaemon() {

        if (!this.connected) {
            throw new Error('Not connected to daemon.');
        }

        return new Promise((resolve, reject) => {
            // Emit stop request
            this.ipc.of.matrix_daemon.emit('stop_daemon');

            // Listen for confirmation
            const onStopped = async () => {
                console.log('✅ Received stop confirmation from daemon.');

                this.ipc.of.matrix_daemon.off('stopped', onStopped);

                try {
                    await this.disconnect();
                    resolve();
                } catch (err) {
                    reject(err);
                }
            };

            console.log('⏳ Waiting for daemon to stop...');


            this.ipc.of.matrix_daemon.on('stopped', onStopped);

            // Timeout fallback
            setTimeout(() => {
                this.ipc.of.matrix_daemon.off('stopped', onStopped);
                reject(new Error('⌚ Daemon stop request timed out'));
            }, 10000);
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
