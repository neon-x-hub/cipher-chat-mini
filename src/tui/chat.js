const blessed = require('neo-blessed');



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


    let streamingLocked = false;

    let inChatCommands;

    (async () => {
        const { InChatCommands } = await import('./in-chat.mjs');
        inChatCommands = new InChatCommands(
            room,
            screen,
            messageList,
            inputBar,
            (lockState) => streamingLocked = !lockState
        );
    })();




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

    inputBar.on('submit', async (text) => {
        const { sendMessage } = await import('../cli/chat/send.mjs');

        if (text.trim()) {
            try {
                const trimmed = text.trim();

                // If starts with double slash "//" -> treat as normal message starting with "/"
                if (trimmed.startsWith('//')) {
                    const message = {
                        type: 'm.text',
                        body: trimmed.slice(1), // Remove only one slash, keep one
                    };
                    await sendMessage(room, message);
                }
                // If starts with single slash -> treat as command
                else if (trimmed.startsWith('/')) {
                    // Check if it's a known command
                    const commandName = trimmed.split(/\s+/)[0]; // e.g., "/history"
                    if (inChatCommands.isAvailableCommand(commandName)) {
                        inChatCommands.executeCommand(trimmed);
                    } else {
                        // Unknown command warning
                        messageList.pushLine(`{yellow-fg}{inverse}{bold}SYSTEM ~ Unknown command "${commandName.length > 10 ? commandName.slice(0, 10) + '...' : commandName}".{/bold}{/inverse}{/yellow-fg}`);
                        messageList.pushLine(`{yellow-fg}Tip: If you want to send a message starting with "/", type "//" instead.{/yellow-fg}`);
                    }
                }
                // Regular message
                else {
                    const message = {
                        type: 'm.text',
                        body: trimmed,
                    };
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

    await streamChatMessages(room, messageList, screen, () => !streamingLocked);

    return { screen, messageList, inputBar };
}

module.exports = initTUI;
