import { clientProxy } from "../../matrix/client.mjs";
import string2color from "../../utils/string2color.js";

async function streamChatMessages(room, messageList, screen) {

    const client = clientProxy;

    if (!room) {
        throw new Error(`Room not found or not joined`);
    }

    const result = await client.streamMessages({
        room: { roomId: room.roomId },
        callback: (message) => {
            const senderColor = string2color(message.sender);
            messageList.pushLine(`{${senderColor}-fg}${message.sender}{/${senderColor}-fg}: ${message.body}`
            );
            messageList.setScrollPerc(100);
            screen.render();
        }
    });

    return result;
}

export { streamChatMessages };
