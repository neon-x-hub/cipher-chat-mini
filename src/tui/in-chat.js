/**
 * InChatCommands class to handle in-chat commands.
 */
class InChatCommands {
    constructor(screen, messageList, inputBar) {
        this.commands = {
            '/help': this.help,
            '/clear': this.clear,
            '/exit': this.exit,
            '/save': this.save,
            '/load': this.load,
            '/settings': this.settings,
            '/error': this.error,
        };
        this.screen = screen;
        this.messageList = messageList;
        this.inputBar = inputBar;
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

    save() {
        console.log('Saving chat...');
    }

    load() {
        console.log('Loading chat...');
    }

    settings() {
        console.log('Opening settings...');
    }

    error() {
        throw new Error("This is a simulated error for testing purposes.");
    }

    executeCommand(command) {
        if (this.commands.hasOwnProperty(command)) {
            this.commands[command].call(this);
        } else {
            this.messageList.pushLine(`SYSTEM ~ Command "${command}" not recognized.`);
        }
    }

    isAvailableCommand(command) {
        return this.commands.hasOwnProperty(command);
    }

}

module.exports = InChatCommands;
