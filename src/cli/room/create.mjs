import { getClient } from "../../matrix/client.mjs";

async function createRoom(roomName, isPrivate = true, topic = "") {
    const client = await getClient();

    try {
        // Ensure client is synced before creating a room
        if (!client.isInitialSyncComplete()) {
            await new Promise((resolve, reject) => {
                client.once('sync', (state, prevState, res) => {
                    if (state === 'PREPARED' || state === 'SYNCING') {
                        resolve();
                    }
                });
                client.once('error', reject);
                client.startClient();
            });
        }

        // Room creation options
        const options = {
            name: roomName,
            topic: topic,
            preset: isPrivate ? 'private_chat' : 'public_chat',
            visibility: isPrivate ? 'private' : 'public',
            initial_state: [
                {
                    type: "m.room.history_visibility",
                    state_key: "",
                    content: {
                        history_visibility: isPrivate ? "invited" : "shared"
                    }
                }
            ]
        };

        console.log(`Creating room "${roomName}"...`);
        const { room_id } = await client.createRoom(options);

        console.log(`✅ Room created successfully!`);
        console.log(`🔗 Room ID: ${room_id}`);
        console.log(`🔐 ${isPrivate ? "Private" : "Public"} room`);

        return room_id;

    } catch (error) {
        console.error('Failed to create room:', error.message);
        throw error; // Re-throw to allow caller to handle
    }
}

export { createRoom };
