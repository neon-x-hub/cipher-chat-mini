import { clientProxy } from "../../matrix/client.mjs";
import SimpleTimeParse from "../../utils/simple-time-parse.js";
/**
 * Retrieves messages from a Matrix room within a specified time range.
 *
 * @async
 * @param {Object} room - The room object containing the ID.
 * @param {string|Date} startDate - The start of the time range (ISO format or relative like 1d, 1h, 30m).
 * @param {string|Date} endDate - The end of the time range (ISO format or relative like now, 1h, 1d).
 * @param {Object} [options] - Additional options.
 * @param {number} [options.limit=100] - Maximum number of messages to return.
 * @param {string} [options.direction='b'] - Direction to paginate ('b' for backward, 'f' for forward).
 * @param {boolean} [logDetails=false] - Whether to log detailed information about the messages.
 * @returns {Promise<Array>} - A promise that resolves to the array of message objects.
 * @throws Will throw an error if the operation fails.
 */
async function getMessagesInTimeRange(room, startDate, endDate, options = {}, logDetails = false) {
    const client = clientProxy;

    try {
        if (logDetails) {
            console.log(`Fetching messages from ${room.roomName || room.roomId}`);
        }

        const startTime = SimpleTimeParse(startDate);
        const endTime = SimpleTimeParse(endDate);

        const response = await client.getMessages({
            roomId: room.roomId,
            startDate: startTime.getTime(),
            endDate: endTime.getTime(),
            options
        });

        if (logDetails) {
            console.log(`✅ Found ${response.length} messages`);
            response.forEach((message) => {
                console.log(`- ${message.event.sender} (${SimpleTimeParse(message.event.origin_server_ts).toLocaleTimeString()}): ${message.event.content.body}`);
            });
        }

        return response;

    } catch (error) {
        if (logDetails) {
            console.error('Failed to fetch messages:', error.message);
        }
        throw error;
    }
}

export { getMessagesInTimeRange };
