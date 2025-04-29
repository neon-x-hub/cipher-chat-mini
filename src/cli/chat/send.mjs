// src/sendMessage.mjs
import { getClient } from "../../matrix/client.mjs";

async function sendMessage(room, message, messageType = "m.text", logDetails = false) {
    const client = await getClient();

    try {
        // Ensure client is synced before sending
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


        if (!room) {
            throw new Error(`Room not found or not joined`);
        }

        if (logDetails) {

            console.log(`Sending message to room ${room.name || room.roomId}...`);

        }

        // Send the message
        const eventId = await client.sendMessage(room.roomId, {
            msgtype: messageType,
            body: message
        });

        if (logDetails) {

            console.log(`✅ Message sent successfully!`);
            console.log(`🔗 Event ID: ${eventId}`);
            console.log(`🏠 Room: ${room.name || 'Unnamed Room'}`);
            console.log(`✉️ Content: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`);

        }


        return eventId;

    } catch (error) {
        if (logDetails) {
            console.error('Failed to send message:', error.message);
        }
        throw error;
    }
}

export { sendMessage };
