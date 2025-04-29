import { clientProxy } from "../../matrix/client.mjs"

async function listRooms() {

    const client = clientProxy;

    try {

        const rooms = await client.listRooms();

        console.log(`\n=== Your Rooms (${rooms.length}) ===\n`);

        rooms.forEach((room, index) => {

            const {roomId ,roomName, memberCount, lastMessage, lastEvent} = room;

            console.log(`${index + 1}. ${roomName}`);
            console.log(`   Room ID: ${roomId}`);
            console.log(`   Members: ${memberCount}`);
            console.log(`   Last Activity: ${new Date(lastEvent).toLocaleString()}`);
            console.log(`   Preview: "${lastMessage.substring(0, 60)}${lastMessage.length > 60 ? '...' : ''}"`);
            console.log('─────────────────────────────────────────');
        });

    } catch (error) {
        console.error('Failed to list rooms:', error.message);
    }
}

export { listRooms };
