import { getMessagesInTimeRange } from "../cli/chat/get.mjs";
import string2color from "../utils/string2color.js";

/**
 * InChatCommands class to handle in-chat commands.
 */
class InChatCommands {
    constructor(room, screen, messageList, inputBar, streamingControl) {
        this.commands = {
            '/help': this.help,
            '/clear': this.clear,
            '/exit': this.exit,
            '/error': this.error,
            '/history': this.history,
            '/sync': this.sync,
        };
        this.room = room;
        this.screen = screen;
        this.messageList = messageList;
        this.inputBar = inputBar;
        this.streamingControl = streamingControl;
    }

    help() {
        this.messageList.pushLine('{green-fg}{inverse}SYSTEM ~ Available commands:{/inverse}{/green-fg}');
        for (const command in this.commands) {
            this.messageList.pushLine(`> {green-fg}${command}{/green-fg}`);
        }
    }

    clear() {
        this.messageList.setContent('');
        this.messageList.setScrollPerc(0);
    }

    exit() {
        this.messageList.pushLine('SYSTEM ~ Exiting chat...');
        process.exit(0);
    }

    error() {
        throw new Error("This is a simulated error for testing purposes.");
    }

    /**
     * Fetch chat history between two times.
     * Usage: /history <fromTime> <toTime>
     */
    async history(fromTime, toTime) {
        try {
            if (!fromTime || !toTime) {
                throw new Error('Usage: /history <fromTime> <toTime>');
            }
            this.streamingControl(false);
            this.messageList.pushLine(`{cyan-fg}{inverse}{bold}SYSTEM ~ Fetching history from "${fromTime}" to "${toTime}"...{/bold}{/inverse}{/cyan-fg}`);
            const messages = await getMessagesInTimeRange(this.room, fromTime, toTime);
            if (messages.length === 0) {
                this.messageList.pushLine(`No messages found between "${fromTime}" and "${toTime}".`);
            } else {
                this.clear();
                messages.forEach(message => {
                    const senderColor = string2color(message.event.sender);
                    this.messageList.pushLine(`{${senderColor}-fg}${message.event.sender}{/${senderColor}-fg}: ${message.event.content.body}`);
                    this.messageList.setScrollPerc(100);
                    this.screen.render();
                });
            }
        } catch (error) {
            this.messageList.pushLine(`{red-fg}{inverse}{bold}SYSTEM ~ Error: ${error.message}{/bold}{/inverse}{/red-fg}`);
            this.screen.render();
        }

    }

    /**
     * Sync messages from a certain point to now.
     * Usage: /sync <fromTime>
     */
    async sync(fromTime) {
        try {
            if (!fromTime) {
                throw new Error('Usage: /sync <fromTime>');
            }
            this.streamingControl(true);
            this.messageList.pushLine(`SYSTEM ~ Syncing messages from "${fromTime}" to now...`);
            const messages = await getMessagesInTimeRange(this.room, fromTime, 'now');
            if (messages.length === 0) {
                this.messageList.pushLine(`No messages found from "${fromTime}" to now.`);
            } else {
                this.clear();
                messages.forEach(message => {
                    const senderColor = string2color(message.event.sender);
                    this.messageList.pushLine(`{${senderColor}-fg}${message.event.sender}{/${senderColor}-fg}: ${message.event.content.body}`);
                    this.messageList.setScrollPerc(100);
                    this.screen.render();
                });
            }

        } catch (error) {
            this.messageList.pushLine(`{red-fg}{inverse}{bold}SYSTEM ~ Error: ${error.message}{/bold}{/inverse}{/red-fg}`);
            this.screen.render();
        }
    }

    /**
     * Execute a command.
     * Supports passing parameters (e.g., /history 2d now)
     */
    executeCommand(input) {
        const parts = input.trim().split(/\s+/);
        const command = parts[0];
        const args = parts.slice(1);

        if (this.commands.hasOwnProperty(command)) {
            this.commands[command].call(this, ...args);
        } else {
            this.messageList.pushLine(`SYSTEM ~ Command "${command}" not recognized.`);
        }
    }

    isAvailableCommand(command) {
        return this.commands.hasOwnProperty(command);
    }
}

export { InChatCommands };
