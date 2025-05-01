import { clientProxy } from "../../matrix/client.mjs";

async function streamChatMessages(room, messageList, screen) {

    const client = clientProxy;

    if (!room) {
        throw new Error(`Room not found or not joined`);
    }

    const result = await client.streamMessages({
        room: { roomId: room.roomId },
        callback: (message) => {
            messageList.pushLine(`${message.sender}: ${message.body}`);
            messageList.setScrollPerc(100);
            screen.render();
        }
    });

    return result;
}

export { streamChatMessages };
