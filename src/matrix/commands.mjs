// Matrix client
import {
    MatrixClient,
} from 'matrix-bot-sdk';
/**
 * MatrixCommands class to handle Matrix operations.
 * @class MatrixCommands
 * @description This class provides methods to manage authentication, rooms, and chat messages in a Matrix client.
 * @property {MatrixClient} client - The Matrix client instance used to interact with the Matrix server.
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
     * Lists Matrix rooms with optional filtering by membership.
     *
     * @async
     * @param {Object} [options] - Filtering options.
     * @param {string} [options.membership] - Membership filter: "join", "invite", "leave", or null for all.
     * @returns {Promise<Array>} - A promise that resolves to the list of rooms.
     */
    async listRooms(options = {}) {
        const { membership = "join" } = options;

        let roomIds = [];

        if (!membership || membership === "join") {
            roomIds = await this.client.getJoinedRooms();
        } else if (membership === "invite") {
            // For invites, fetch the sync state
            const sync = await this.client.getSyncState();
            roomIds = Object.keys(sync.rooms?.invite || {});
        } else if (membership === "leave") {
            // Similarly for left rooms
            const sync = await this.client.getSyncState();
            roomIds = Object.keys(sync.rooms?.leave || {});
        } else {
            // Invalid membership filter
            throw new Error(`Unknown membership filter: ${membership}`);
        }

        const rooms = [];

        for (const roomId of roomIds) {
            let roomName = "Unnamed Room";
            let memberCount = 0;
            let lastEvent = null;
            let lastMessage = "No messages yet";

            try {
                // Try to get the room name (from state event)
                const nameEvent = await this.client.getRoomStateEvent(roomId, "m.room.name", "");
                if (nameEvent?.name) {
                    roomName = nameEvent.name;
                }
            } catch (e) {
                // If no name event, skip error
            }

            try {
                // Get member count
                const members = await this.client.getJoinedRoomMembers(roomId);
                memberCount = members.length;
            } catch (e) {
                // Skip if failed
            }

            try {
                // Get latest messages (fetch most recent messages)
                const messages = await this.client.getMessages(roomId, undefined, 10, "b"); // Getting the last 10 messages
                if (messages.chunk && messages.chunk.length > 0) {
                    lastEvent = messages.chunk[0];
                    lastMessage = lastEvent.content?.body || "Non-text message";
                }
            } catch (e) {
                // Skip if no messages or error fetching
            }

            rooms.push({
                roomId,
                roomName,
                memberCount,
                lastEvent: lastEvent?.origin_server_ts ? new Date(lastEvent.origin_server_ts) : null,
                lastMessage
            });
        }

        return rooms;
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
     * @returns {Promise<{{roomId: string, roomName: string, canonicalAlias: string, memberCount: number, roomType: string}}>} - A promise that resolves with the joined room's details.
     */
    async joinRoom(params) {
        const { roomId } = params;

        // Join the room
        await this.client.joinRoom(roomId);

        let roomName = "Unnamed Room";
        let canonicalAlias = "None";
        let memberCount = 0;
        let roomType = "Regular chat"; // Default room type (could be specialized in the future)

        // Fetch room state details
        try {
            // Fetch the room name (m.room.name)
            const nameEvent = await this.client.getRoomStateEvent(roomId, "m.room.name", "");
            if (nameEvent?.name) {
                roomName = nameEvent.name;
            }
        } catch (error) {
            console.error("Error fetching room name:", error);
        }

        try {
            // Fetch the canonical alias (m.room.canonical_alias)
            const aliasEvent = await this.client.getRoomStateEvent(roomId, "m.room.canonical_alias", "");
            if (aliasEvent?.alias) {
                canonicalAlias = aliasEvent.alias;
            }
        } catch (error) {
            console.error("Error fetching room canonical alias:", error);
        }

        try {
            // Get the member count (list of joined members)
            const members = await this.client.getJoinedRoomMembers(roomId);
            memberCount = members.length;
        } catch (error) {
            console.error("Error fetching room members:", error);
        }

        // You can define `roomType` here, depending on your application's room type categorization (e.g., "DM" for direct messages).
        // For now, it defaults to "Regular chat".

        return {
            roomId,
            roomName,
            canonicalAlias,
            memberCount,
            roomType,
        };
    }


    /**
     * Leaves a specified Matrix room.
     *
     * @async
     * @param {Object} params - The parameters for leaving the room.
     * @param {string} params.roomId - The room object containing the ID.
     * @returns {Promise} - A promise that resolves when the room has been successfully left.
     * @throws Will throw an error if the operation fails.
     */
    async leaveRoom(params) {
        return await this.client.leave(params.roomId);
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


    async streamMessages(params) {

        const room = this.client.getRoom(params.room.roomId);

        if (!room) {
            throw new Error(`Room with ID ${params.room.roomId} not found`);
        }

        return new Promise((resolve, reject) => {
            const onMessage = (event) => {
                if (event.getType() === 'm.room.message') {
                    // callback with the message event
                    const messageContent = event.getContent();
                    const sender = event.getSender();

                    params.callback({
                        roomId: room.roomId,
                        sender,
                        body: messageContent.body,
                    });

                }
            };

            room.on('Room.timeline', onMessage);

            // Cleanup function to remove the listener
            return () => {
                room.off('Room.timeline', onMessage);
            };

        });
    }

}
