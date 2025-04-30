import { clientProxy } from "../../matrix/client.mjs";

async function sendMessage(room, message, logDetails = false) {

    const client = clientProxy;

    try {

        if (!room) {
            throw new Error(`Room not found or not joined`);
        }

        if (logDetails) {

            console.log(`Sending message to room ${room.roomName || room.roomId}...`);

        }

        // Send the message
        const eventId = await client.sendMessage({
            room,
            message
        });

        if (logDetails) {

            console.log(`✅ Message sent successfully!`);
            console.log(`🔗 Event ID: ${eventId}`);
            console.log(`🏠 Room: ${room.roomName || 'Unnamed Room'}`);
            console.log(`✉️ Content: "${message.body.substring(0, 50)}${message.body.length > 50 ? '...' : ''}"`);

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
