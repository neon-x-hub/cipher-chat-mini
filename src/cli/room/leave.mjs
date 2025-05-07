import { clientProxy } from "../../matrix/client.mjs";

/**
 * Leaves a specified Matrix room.
 *
 * @async
 * @param {Object} params - The parameters for leaving the room.
 * @param {string} params.roomId - The room object containing the ID.
 * @returns {Promise} - A promise that resolves when the room has been successfully left.
 * @throws Will throw an error if the operation fails.
 */
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
