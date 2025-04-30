import { clientProxy } from "../../matrix/client.mjs";

async function createRoom(roomName, isPrivate = true, topic = "") {


    try {
        const client = clientProxy;

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
