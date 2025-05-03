import IPC from 'node-ipc';
import config from '../state/config.js';
import { MatrixCommands } from '../matrix/commands.mjs';
// Matrix client
import {
    MatrixClient,
    SimpleFsStorageProvider,
    AutojoinRoomsMixin,
    LogService
} from 'matrix-bot-sdk';
/**
 * * MatrixDaemon class to handle IPC communication and Matrix commands.
 * * @class MatrixDaemon
 * * @description This class sets up an IPC server to listen for commands and execute them using the MatrixCommands class.
 * * * @property {IPC.IPC} ipc - Instance of the IPC server for inter-process communication.
 * * @property {MatrixCommands} commands - Instance of the MatrixCommands class to handle Matrix operations.
 * * @method start - Initializes the IPC server and MatrixCommands instance.
 * * @method setupIPC - Sets up the IPC server to listen for incoming commands and respond with results or errors.
 */
export class MatrixDaemon {
    constructor() {
        this.ipc = new IPC.IPC();
        this.commands = null;
    }

    /**
     * Creates and initializes a Matrix client instance.
     *
     * @async
     * @returns {Promise<MatrixClient>} - A promise that resolves to the initialized Matrix client.
     *
     * @description
     * This function creates a new Matrix client using the provided configuration parameters,
     * sets up error handling for client errors, and waits until the client's initial sync
     * state is 'PREPARED'. If the client initialization fails, it throws an error.
     */
    async _createClient() {
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
     * Initializes the IPC server and MatrixCommands proxy via the MatrixClientProxy.
     *
     * Sets up the IPC server to listen for incoming commands and
     * initializes the MatrixCommands instance to handle the commands.
     *
     * @returns {Promise<void>} - A promise that resolves when the IPC server is started.
     */
    async start() {
        const client = await this._createClient();
        this.commands = new MatrixCommands(client);
        this.setupIPC();

        return new Promise((resolve) => {
            this.ipc.server.on('start', () => {
                console.log('IPC server started and listening for commands...');
                resolve();
            });

        });
    }

    /**
     * Sets up the IPC server to listen for incoming commands and respond with results or errors.
     *
     * @description
     * This function sets up the IPC server to listen for incoming commands and
     * calls the appropriate method on the MatrixCommands instance with the provided
     * parameters. If the command is successful, a response event is emitted with the
     * result data. If the command fails, a response event is emitted with the error
     * message.
     */
    setupIPC() {
        this.ipc.config.id = `matrix_daemon`;
        this.ipc.config.retry = 1500;
        this.ipc.config.silent = true;

        this.ipc.serve(() => {
            // Handle commands
            this.ipc.server.on('command', async (data, socket) => {
                try {

                    console.log(`Received command: ${data.action} with params:`, data.params);

                    let result;

                    if (data.action === "streamMessages") {
                        // Stream messages get emitted differently
                        result = await this.commands[data.action]({
                            ...data.params,
                            callback: (streamData) => {
                                this.ipc.server.emit(socket, 'response', {
                                    requestId: data.requestId,
                                    success: true,
                                    data: streamData
                                });
                            }
                        });

                        return; // prevent double response
                    } else {
                        // Normal atomic commands
                        result = await this.commands[data.action](data.params);

                        this.ipc.server.emit(socket, 'response', {
                            requestId: data.requestId,
                            success: true,
                            data: result
                        });
                    }

                } catch (error) {
                    this.ipc.server.emit(socket, 'response', {
                        requestId: data.requestId,
                        success: false,
                        error: error.message
                    });
                }
            });

            // Handle daemon stop request
            this.ipc.server.on('stop_daemon', async (data, socket) => {

                console.log('Received stop_daemon request, shutting down...');

                try {
                    this.stop();

                    // Emit confirmation to client
                    this.ipc.server.emit(socket, 'stopped');

                    // Exit the process after short delay
                    setTimeout(() => {
                        process.exit(0);
                    }, 100);
                } catch (err) {
                    console.error('Failed to stop daemon:', err);
                }
            });


        });

        // Start server with error listener
        this.ipc.server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`Error: Another instance of matrix_daemon is already running.`);
                process.exit(1); // Or throw error if you prefer
            } else {
                console.error('IPC Server error:', err);
            }
        });

        this.ipc.server.start();
    }



    /**
     * Stops the IPC server and Matrix client.
     *
     * This function halts the IPC server to cease listening for incoming commands.
     * It also stops the Matrix client if it is running, ensuring both the server
     * and client are properly shut down to free up resources.
     */
    stop() {
        this.ipc.server.stop();
        this.client?.stopClient?.();
    }

}
