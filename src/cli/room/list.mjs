import { getClient } from "../../matrix/client.mjs"

async function listRooms() {
    const client = await getClient();

    try {
        // If client isn't syncing yet, wait for sync
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

        const rooms = client.getRooms();

        console.log(`\n=== Your Rooms (${rooms.length}) ===\n`);

        rooms.forEach((room, index) => {
            const roomName = room.name || "Unnamed Room";
            const memberCount = room.getJoinedMembers().length;
            const lastEvent = room.timeline[room.timeline.length - 1];
            const lastMessage = lastEvent?.getContent()?.body || "No messages yet";

            console.log(`${index + 1}. ${roomName}`);
            console.log(`   Room ID: ${room.roomId}`);
            console.log(`   Members: ${memberCount}`);
            console.log(`   Last Activity: ${new Date(lastEvent?.getDate()).toLocaleString()}`);
            console.log(`   Preview: "${lastMessage.substring(0, 60)}${lastMessage.length > 60 ? '...' : ''}"`);
            console.log('─────────────────────────────────────────');
        });

    } catch (error) {
        console.error('Failed to list rooms:', error.message);
    }
}

export { listRooms };
