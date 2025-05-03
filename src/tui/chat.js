const blessed = require('neo-blessed');
const InChatCommands = require('./in-chat.js');

async function initTUI(room) {
    const screen = blessed.screen({
        smartCSR: true,
        title: `Chat Room: ${room.roomName}`,
    });

    const messageList = blessed.box({
        top: 0,
        left: 0,
        width: '100%',
        height: '93%',
        tags: true,
        scrollable: true,
        alwaysScroll: true,
        keys: true,
        vi: true,
        mouse: true,
        scrollbar: {
            ch: ' ',
            inverse: true,
        },
        border: {
            type: 'line',
        },
        style: {
            border: { fg: 'white' },
            scrollbar: {
                bg: 'white',
            },
        },
    });

    const inputBar = blessed.textbox({
        bottom: 0,
        height: 3,
        width: '100%',
        inputOnFocus: true,
        border: {
            type: 'line',
        },
        style: {
            border: { fg: 'white' },
        },
    });

    const inChatCommands = new InChatCommands(screen, messageList, inputBar);

    // Ignore arrow keys in input to prevent conflict
    inputBar.ignoreKeys = ['up', 'down', 'pageup', 'pagedown'];

    screen.append(messageList);
    screen.append(inputBar);

    // Exit handling
    screen.key(['C-c', 'escape'], () => process.exit(0));

    // Tab switching
    screen.key(['tab'], () => {
        if (screen.focused === inputBar) {
            messageList.focus();
        } else {
            inputBar.focus();
        }
        screen.render();
    });

    // Message list scrolling (only when messageList is focused)
    messageList.key(['up', 'k'], () => {
        messageList.scroll(-1);
        screen.render();
    });

    messageList.key(['down', 'j'], () => {
        messageList.scroll(1);
        screen.render();
    });

    messageList.key(['pageup'], () => {
        messageList.scroll(-Math.floor(messageList.height * 0.9));
        screen.render();
    });

    messageList.key(['pagedown'], () => {
        messageList.scroll(Math.floor(messageList.height * 0.9));
        screen.render();
    });

    // Handle up/down arrows when input is focused
    inputBar.on('keypress', (ch, key) => {
        if (key.name === 'up' || key.name === 'down') {
            // Only scroll if input is empty or at boundary
            if (inputBar.value === '' ||
                (key.name === 'up' && inputBar.cursor === 0) ||
                (key.name === 'down' && inputBar.cursor === inputBar.value.length)) {
                messageList.focus();
                messageList.scroll(key.name === 'up' ? -1 : 1);
                screen.render();
                return; // Prevent default behavior
            }
        }
    });

    // Input submission
    inputBar.on('submit', async (text) => {

        const { sendMessage } = await import('../cli/chat/send.mjs');

        if (text.trim()) {
            try {
                const message = {
                    type: 'm.text',
                    body: text,
                };

                // Check if the command is available
                if (inChatCommands.isAvailableCommand(text)) {
                    inChatCommands.executeCommand(text);
                }
                else {
                    await sendMessage(room, message);
                }


            } catch (error) {
                messageList.pushLine(`{red-fg}{inverse}{bold}SYSTEM ~ Error: ${error.message}{/bold}{/inverse}{/red-fg}`);
            }
            messageList.setScrollPerc(100);
        }
        inputBar.clearValue();
        screen.render();
        inputBar.focus();
    });

    // Initial focus
    inputBar.focus();
    messageList.pushLine(`You joined room: ${room.roomName} (${room.roomId})`);
    screen.render();

    // Stream messages from the room
    const { streamChatMessages } = await import('../cli/chat/stream.mjs');

    //await streamChatMessages(room, messageList, screen);

    return { screen, messageList, inputBar };
}

module.exports = initTUI;
