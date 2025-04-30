import { clientProxy } from "../../matrix/client.mjs";

async function joinRoom(roomObj) {
    const client = clientProxy;

    try {

        // Join the room - this returns a Room object
        const room = await client.joinRoom(roomObj);

        return room;

    } catch (error) {
        // Handle specific Matrix errors
        if (error.errcode === 'M_FORBIDDEN') {
            throw new Error('You do not have permission to join this room');
        }
        if (error.errcode === 'M_NOT_FOUND') {
            throw new Error('Room not found - check the ID/alias');
        }
        throw new Error(`Join failed: ${error.message}`);
    }
}

export { joinRoom };
