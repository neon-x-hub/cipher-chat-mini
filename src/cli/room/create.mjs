import { clientProxy } from "../../matrix/client.mjs";

/**
 * Creates a new room in the Matrix client.
 *
 * @async
 * @param {Object} options - The options for creating the room.
 * @param {string} options.name - The name for the new room.
 * @param {string} [options.topic] - The topic/description for the new room.
 * @param {boolean} [options.public] - Whether to make the room public (default: false).
 * @param {boolean} [options.encrypted] - Whether to make the room E2E encrypted (default: false).
 * @returns {Promise<string>} - A promise that resolves with the room ID of the created room.
 */
async function createRoom(options) {


    try {
        const client = clientProxy;

        // Room creation options
        const roomOptions = {
            name: options.name,
            topic: options.topic,
            preset: options.public ? "public_chat" : "private_chat",
            visibility: options.public ? "public" : "private",
            initialState: [
                {
                    type: "m.room.history_visibility",
                    state_key: "",
                    content: {
                        history_visibility: options.public ? "shared" : "invited",
                    }
                }
            ]
        };

        if (options.encrypted) {
            roomOptions.initialState.push({
                type: "m.room.encryption",
                state_key: "",
                content: {
                    algorithm: "m.megolm.v1.aes-sha2"
                }
            });

        }

            console.log(`Creating room "${options.name}"...`);
            const { roomId } = await client.createRoom(roomOptions);
            console.log(`✅ Room created successfully!`);
            console.log(`🔗 Room ID: ${roomId}`);
            console.log(`🔐 ${options.public ? "Public" : "Private"} room`);

            return roomId;

        } catch (error) {
            console.error('Failed to create room:', error.message);
            throw error; // Re-throw to allow caller to handle
        }
    }

export { createRoom };
