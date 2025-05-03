import { clientProxy } from "../../matrix/client.mjs";

async function leaveRoom(room) {
    const client = clientProxy;

    try {
        await client.leaveRoom(room);

        return;

    } catch (error) {
        // Handle specific Matrix errors
        if (error.errcode === 'M_FORBIDDEN') {
            throw new Error('You do not have permission to do this action.');
        }
        if (error.errcode === 'M_NOT_FOUND') {
            throw new Error('Room not found - check the ID/alias');
        }
        throw new Error(`Leave failed: ${error.message}`);
    }
}

export { leaveRoom };
