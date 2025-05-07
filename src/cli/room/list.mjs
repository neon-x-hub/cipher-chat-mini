import { clientProxy } from "../../matrix/client.mjs";

/**
* Lists Matrix rooms with optional filtering by membership.
*
* @async
* @param {Object} [options] - Filtering options.
* @param {string} [options.membership] - Membership filter: "join", "invite", "leave", or null for all.
* @returns {Promise<Array>} - A promise that resolves to the list of rooms.
* @throws {Error} - Throws an error if the listing fails.
*/
async function listRooms(options = {}) {
    const client = clientProxy;

    try {
        const rooms = await client.listRooms(options);

        console.log(`\n=== Your Rooms (${rooms.length}) ===\n`);

        rooms.forEach((room, index) => {
            const { roomId, roomName, memberCount, lastMessage, lastEvent } = room;

            console.log(`${index + 1}. ${roomName}`);
            console.log(`   Room ID: ${roomId}`);
            console.log(`   Members: ${memberCount}`);
            console.log(`   Last Activity: ${lastEvent ? new Date(lastEvent).toLocaleString() : 'No activity yet'}`);
            console.log(`   Preview: "${lastMessage.substring(0, 60)}${lastMessage.length > 60 ? '...' : ''}"`);
            console.log('─────────────────────────────────────────');
        });

    } catch (error) {
        console.error('Failed to list rooms:', error.message);
    }
}

export { listRooms };
