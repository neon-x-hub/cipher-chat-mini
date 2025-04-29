import { getClient } from "../../matrix/client.mjs";

async function joinRoom(roomIdentifier) {
    const client = await getClient();

    try {
        // Ensure client is synced before joining
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

        // Join the room - this returns a Room object
        const room = await client.joinRoom(roomIdentifier);

        // Wait for room state to fully load if needed
        if (!room.currentState) {
            await new Promise(resolve => {
                const onRoomState = () => {
                    if (room.currentState) {
                        client.off('RoomState.events', onRoomState);
                        resolve();
                    }
                };
                client.on('RoomState.events', onRoomState);
            });
        }

        // Get room details
        const roomName = room.name ||
                       room.currentState?.name ||
                       'Unnamed Room';
        const canonicalAlias = room.canonicalAlias ||
                              roomIdentifier;
        const roomId = room.roomId;

        return {
            roomId,
            roomName,
            canonicalAlias,
            room // Return full room object for additional functionality
        };

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
