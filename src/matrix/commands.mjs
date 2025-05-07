// Matrix client
import {
    MatrixClient,
    MatrixAuth
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
     * @param {MatrixClient} client - The Matrix client instance used to interact with the Matrix server.
     */
    constructor(client) {
        this.client = client;
    }

    /*
    ==================================================================
    Auth Management Commands
    ==================================================================
    */

    static async login({ homeserverUrl, username, password }) {

        const auth = new MatrixAuth(homeserverUrl);

        const { accessToken, userId, deviceId } = await auth.passwordLogin(username, password);

        return {
            accessToken,
            userId,
            deviceId
        }
    }

    static async register({ homeserverUrl, username, password }) {

        const auth = new MatrixAuth(homeserverUrl);

        const { accessToken, userId, deviceId } = await auth.passwordRegister(username, password);

        return {
            accessToken,
            userId,
            deviceId
        }
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

        const getRoomName = async (roomId) => {
            try {
                const nameEvent = await this.client.getRoomStateEvent(roomId, "m.room.name", "");
                return nameEvent?.name || "Unnamed Room";
            } catch {
                return "Unnamed Room";
            }
        };

        const getMemberCount = async (roomId) => {
            try {
                const members = await this.client.getJoinedRoomMembers(roomId);
                return members.length;
            } catch {
                return 0;
            }
        };

        const getLastMessageInfo = async (roomId) => {
            try {
                const token = await this.client.storageProvider.getSyncToken();

                if (!token) {
                    throw new Error("No sync token available. Sync at least once first.");
                }

                const messages = await this.client.doRequest(
                    "GET",
                    `/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/messages`,
                    {
                        from: token,
                        dir: "b",
                        limit: 1,
                    }
                );

                if (messages.chunk && messages.chunk.length > 0) {
                    const lastEvent = messages.chunk[0];
                    return {
                        lastEventTime: new Date(lastEvent.origin_server_ts),
                        lastMessage: lastEvent.content?.body || "None",
                    };
                }
            } catch (err) {
                console.error("Failed to get last message:", err);
            }
            return {
                lastEventTime: null,
                lastMessage: "No messages yet",
            };
        };


        let roomIds = [];

        if (!membership || membership === "join") {
            roomIds = await this.client.getJoinedRooms();
        } else if (membership === "invite" || membership === "leave") {
            try {
                const sync = await this.client.doRequest("GET", "/_matrix/client/v3/sync", {
                    timeout: 30000
                });

                const roomsInState = sync.rooms[membership];
                roomIds = Object.keys(roomsInState || {});

            } catch (err) {
                console.error(`Failed to get rooms for membership ${membership}:`, err);
                throw new Error(`Failed to get rooms for membership ${membership}`);
            }
        } else {
            throw new Error(`Unknown membership filter: ${membership}`);
        }

        const rooms = [];

        for (const roomId of roomIds) {
            const [roomName, memberCount, { lastEventTime, lastMessage }] = await Promise.all([
                getRoomName(roomId),
                getMemberCount(roomId),
                getLastMessageInfo(roomId)
            ]);

            rooms.push({
                roomId,
                roomName,
                memberCount,
                lastEvent: lastEventTime,
                lastMessage
            });
        }

        return rooms;
    }



    /**
     * Creates a new room with the specified parameters.
     *
     * @async
     * @param {RoomCreateOptions} params - The parameters for room creation.
     * @returns {Promise<{roomId: string}>} - A promise that resolves with the created room's details.
     */
    async createRoom(params) {
        const roomId = await this.client.createRoom(params);
        return { roomId };
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

        await this.client.joinRoom(roomId);

        let roomName = "Unnamed Room";
        let canonicalAlias = "None";
        let memberCount = 0;
        let roomType = "Regular chat";

        try {
            const nameEvent = await this.client.getRoomStateEvent(roomId, "m.room.name", "");
            if (nameEvent?.name) {
                roomName = nameEvent.name;
            }
        } catch (error) {
            console.error("Error fetching room name:", error);
        }

        try {
            const aliasEvent = await this.client.getRoomStateEvent(roomId, "m.room.canonical_alias", "");
            if (aliasEvent?.alias) {
                canonicalAlias = aliasEvent.alias;
            }
        } catch (error) {
            console.error("Error fetching room canonical alias:", error);
        }

        try {
            const members = await this.client.getJoinedRoomMembers(roomId);
            memberCount = members.length;
        } catch (error) {
            console.error("Error fetching room members:", error);
        }

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
        return await this.client.leaveRoom(params.roomId);
    }


    /**
 * Invites a user to a specified Matrix room and returns room metadata.
 *
 * @param {Object} params - Parameters for the invitation.
 * @param {string} params.roomId - The ID of the room to invite the user to.
 * @param {string} params.userId - The ID of the user to invite.
 * @returns {Promise<Object>} An object containing room metadata and invite status.
 */
    async inviteUser(params) {
        const { roomId, userId } = params;

        try {
            await this.client.inviteUser(userId, roomId);
        } catch (error) {
            console.error(`Error inviting user ${userId} to room ${roomId}:`, error);
            throw error;
        }

        let roomName = "Unnamed Room";
        let canonicalAlias = "None";
        let memberCount = 0;
        let roomType = "Regular chat";

        try {
            const nameEvent = await this.client.getRoomStateEvent(roomId, "m.room.name", "");
            if (nameEvent && nameEvent.name) {
                roomName = nameEvent.name;
            }
        } catch (error) {
            console.error("Error fetching room name:", error);
        }

        try {
            const aliasEvent = await this.client.getRoomStateEvent(roomId, "m.room.canonical_alias", "");
            if (aliasEvent && aliasEvent.alias) {
                canonicalAlias = aliasEvent.alias;
            }
        } catch (error) {
            console.error("Error fetching room canonical alias:", error);
        }

        try {
            const members = await this.client.getJoinedRoomMembers(roomId);
            memberCount = members.length;
        } catch (error) {
            console.error("Error fetching room members:", error);
        }

        return {
            roomId,
            userId,
            invited: true,
            roomName,
            canonicalAlias,
            memberCount,
            roomType,
        };
    }




    /*
    ==================================================================
    Chat Management Commands
    ==================================================================
    */



    /**
     * Sends a message to the specified Matrix room.
     *
     * @async
     * @param {Object} params - The parameters for sending the message.
     * @param {Object} params.room - The room object containing the ID.
     * @param {Object} params.message - The message object containing the body and optionally the type.
     * @param {string} [params.message.type=m.text] - The message type (e.g., m.text, m.notice, m.emote, m.file, etc.).
     * @param {string} params.message.body - The message body.
     * @returns {Promise} - A promise that resolves when the message has been successfully sent.
     * @throws Will throw an error if the operation fails.
     */
    async sendMessage(params) {
        return await this.client.sendMessage(params.room.roomId, {
            msgtype: params.message.type || "m.text",
            body: params.message.body
        });
    }



    /**
     * Streams messages from a specified Matrix room. The callback provided will
     * be called for each message received in the room.
     *
     * @async
     * @param {Object} params - The parameters for streaming messages.
     * @param {Object} params.room - The room object containing the ID.
     * @param {Function} params.callback - The callback function to call for each message.
     * @returns {Function} - A cleanup function to call when you want to stop streaming.
     * @throws Will throw an error if the operation fails.
     */
    async streamMessages(params) {
        const handler = async (roomId, event) => {
            if (roomId !== params.room.roomId) return;
            if (event['type'] !== 'm.room.message') return;

            const content = event['content'];
            const sender = event['sender'];

            params.callback({
                roomId,
                sender,
                body: content.body,
            });
        };

        this.client.on('room.event', handler);

        return () => {
            this.client.removeListener('room.event', handler);
        };
    }


    /**
    * Fetches messages from a room within a specific time range
    *
    * @async
    * @param {string} roomId - The ID of the room to fetch messages from
    * @param {Date} startDate - The start of the time range
    * @param {Date} endDate - The end of the time range
    * @param {Object} [options] - Additional options
    * @param {number} [options.limit=100] - Maximum number of messages to return
    * @param {string} [options.direction='b'] - Direction to paginate ('b' for backward, 'f' for forward)
    * @returns {Promise<Array<{event: object, timestamp: Date}>>} - Array of message events with timestamps
    */
    async getMessages({ roomId, startDate, endDate, options = {} }) {
        const { limit = 100, direction = 'b' } = options;
        const messages = [];
        let hasMore = true;
        let fromToken = null;

        const startTime = startDate;
        const endTime = endDate;

        try {
            fromToken = await this.client.storageProvider.getSyncToken();
            if (!fromToken) {
                throw new Error("No sync token available. Sync at least once first.");
            }

            while (messages.length < limit && hasMore) {
                const response = await this.client.doRequest(
                    "GET",
                    `/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/messages`,
                    {
                        from: fromToken,
                        dir: direction,
                        limit: 100,
                    }
                );

                if (!response.chunk || response.chunk.length === 0) {
                    hasMore = false;
                    break;
                }

                for (const event of response.chunk) {
                    const eventTime = event.origin_server_ts;

                    if (eventTime < startTime) {
                        if (direction === 'b') {
                            hasMore = false;
                            break;
                        }
                        continue;
                    }

                    if (eventTime > endTime) {
                        if (direction === 'f') {
                            hasMore = false;
                            break;
                        }
                        continue;
                    }

                    if (event.type === 'm.room.message') {
                        messages.push({
                            event,
                            timestamp: new Date(eventTime)
                        });
                    }

                    if (messages.length >= limit) {
                        hasMore = false;
                        break;
                    }
                }

                fromToken = response.end || null;

                if (!fromToken) {
                    hasMore = false;
                }
            }

            if (direction === 'b') {
                messages.reverse();
            }

            return messages;
        } catch (error) {
            console.error(`Error fetching messages for room ${roomId}:`, error);
            throw error;
        }
    }
}
