import * as sdk from 'matrix-js-sdk';

/**
 * MatrixCommands class to handle Matrix operations.
 * * @class MatrixCommands
 * * @description This class provides methods to manage authentication, rooms, and chat messages in a Matrix client.
 * * @property {sdk.MatrixClient} client - The Matrix client instance used to interact with the Matrix server.
 */
export class MatrixCommands {
    /**
     * Constructs a new MatrixCommands instance with the given client.
     * @param {sdk.MatrixClient} client - The Matrix client instance used to interact with the Matrix server.
     */
    constructor(client) {
        this.client = client;
    }

    /*
    ==================================================================
    Auth Management Commands
    ==================================================================
    */

    /**
     * Logs into the Matrix client using the specified strategy and credentials.
     *
     * @async
     * @param {Object} params - The login parameters.
     * @param {string} params.strategy - The authentication strategy to use (e.g., "m.login.password").
     * @param {Object} params.credentials - The credentials required for the selected strategy.
     * @returns {Promise<Object>} - A promise that resolves with the login response.
     */

    async login(params) {
        return this.client.login(params.strategy, params.credentials);
    }



    /*
    ==================================================================
    Room Management Commands
    ==================================================================
    */

    /**
     * Retrieves the list of rooms the client is currently joined to.
     *
     * @async
     * @returns {Promise<sdk.Room[]>} - A promise that resolves with an array of Room objects.
     */
    async listRooms() {

        return this.client.getRooms().map(room => {
            const roomName = room.name || "Unnamed Room";
            const memberCount = room.getJoinedMembers().length;
            const lastEvent = room.timeline[room.timeline.length - 1];
            const lastMessage = lastEvent?.getContent()?.body || "No messages yet";

            return {
                roomId: room.roomId,
                roomName,
                memberCount,
                lastEvent: lastEvent?.getDate(),
                lastMessage
            };
        });
    }


    /**
     * Creates a new room with the specified parameters.
     *
     * @async
     * @param {sdk.ICreateRoomOpts} params - The parameters for room creation.
     * @returns {Promise<{roomId: string}>} - A promise that resolves with the created room's details.
     */

    async createRoom(params) {
        return await this.client.createRoom(params);
    }

    /**
     * Joins a room by its ID.
     *
     * @async
     * @param {{roomId: string}} params - The parameters for joining the room.
     * @returns {Promise<sdk.Room>} - A promise that resolves with the joined room's details.
     */
    async joinRoom(params) {
        return await this.client.joinRoom(params.roomId);
    }



    /*
    ==================================================================
    Chat Management Commands
    ==================================================================
    */


    /**
     * Sends a message to a specified room.
     *
     * @async
     * @param {{room: sdk.Room, message: {type: string, body: string}}} params - The parameters for sending the message.
     * @param {sdk.Room} params.room - The room object to send the message to.
     * @param {Object} params.message - The message details.
     * @param {string} [params.message.type="m.text"] - The message type (default: "m.text").
     * @param {string} params.message.body - The content of the message.
     * @returns {Promise<sdk.ISendEventResponse>} - A promise that resolves with the event ID of the sent message.
     */

    async sendMessage(params) {
        return await this.client.sendMessage(params.room.roomId, {
            msgtype: params.message.type || "m.text",
            body: params.message.body
        });
    }


}
