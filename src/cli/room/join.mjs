import { clientProxy } from "../../matrix/client.mjs";

/**
 * Joins a room by its ID.
 *
 * @async
 * @param {{roomId: string}} params - The parameters for joining the room.
 * @returns {Promise<{{roomId: string, roomName: string, canonicalAlias: string, memberCount: number, roomType: string}}>} - A promise that resolves with the joined room's details.
 * @throws {Error} - Throws an error if the join fails.
 */
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
