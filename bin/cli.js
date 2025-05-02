// bin/cli.js
const { Command } = require('commander');
const program = new Command();
const initTUI = require('../src/tui/chat');


// Authentication commands
const auth = new Command('auth')
    .description('Authentication commands');

auth.command('login')
    .description('Log in via password/token')
    .action(async () => {
        console.log('Attempting to log in...');
        // Dynamically import the login.mjs
        const { interactiveLogin } = await import('../src/cli/auth/login.mjs');

        await interactiveLogin();
        // pseudo: authenticateUser();
    });

auth.command('logout')
    .description('Clear session')
    .action(() => {
        console.log('Logging out...');
        // pseudo: clearSession();
    });

auth.command('signup')
    .description('Register new account')
    .action(() => {
        console.log('Starting account registration...');
        // pseudo: registerNewAccount();
    });

// Room management commands
const room = new Command('room')
    .description('Room management commands');

room.command('join')
    .description('Join a Matrix room by ID or alias')
    .argument('<room-identifier>', 'Room ID or alias (e.g., !room:domain.com or #alias:domain.com)')
    .action(async (roomIdentifier) => {
        try {
            console.log(`Attempting to join room ${roomIdentifier}...`);

            const room = { roomId: roomIdentifier };

            const { joinRoom } = await import('../src/cli/room/join.mjs');
            const result = await joinRoom(room);


            console.log(`\n✅ Successfully joined room:`);
            console.log(`   ID: ${result.roomId}`);
            console.log(`   Name: ${result.roomName}`);
            console.log(`   Alias: ${result.canonicalAlias || 'None'}`);
            console.log(`   Members: ${result.memberCount}`);
            console.log(`   Type: ${result.roomType}\n`);


            // Start the TUI
            initTUI(result);

        } catch (error) {
            console.error('❌ Failed to join room:', error.message);
            process.exit(1);
        }
    });

room.command('leave <roomId>')
    .description('Exit a room')
    .action((roomId) => {
        console.log(`Leaving room ${roomId}...`);
        // pseudo: leaveRoom(roomId);
    });

room.command('create')
    .description('Create a new Matrix room')
    .requiredOption('-n, --name <name>', 'Name for the new room')
    .option('-p, --public', 'Make room public (default: private)', false)
    .option('-t, --topic <topic>', 'Room topic/description', '')
    .action(async (opts) => {
        try {
            console.log(`Creating new room "${opts.name}"...`);

            // Dynamically import the createRoom function
            const { createRoom } = await import('../src/cli/room/create.mjs');

            const roomId = await createRoom(
                opts.name,
                !opts.public, // isPrivate (inverted from --public flag)
                opts.topic
            );

            console.log(`✅ Success! Room created with ID:\n${roomId}`);
        } catch (error) {
            console.error('❌ Room creation failed:', error.message);
            process.exit(1);
        }
    });

room.command('list')
    .description('Show joined rooms')
    .action(async () => {
        console.log('Listing joined rooms...');

        // time measure
        const start = Date.now();


        const { listRooms } = await import('../src/cli/room/list.mjs');



        try {
            await listRooms();
            console.log(`\nDone in ${Date.now() - start} ms`);
            process.exit(0);
        } catch (err) {
            console.error('Error:', err.message);
        }
    });

// Daemon management commands
const daemon = new Command('daemon')
    .description('Daemon management commands');

daemon.command('start')
    .description('Start the daemon')
    .action(async () => {
        const { startDaemon } = await import('../src/cli/daemon/start.mjs');
        console.log('Starting daemon...');
        try {
            await startDaemon();
            console.log('✅ Daemon started successfully!');
        } catch (error) {
            console.error('❌ Daemon failed to start:', error.message);
            process.exit(1);
        }

    });

daemon.command('stop')
    .description('Stop the daemon')
    .action(async () => {
        const { stopDaemon } = await import('../src/cli/daemon/stop.mjs');
        console.log('Stopping daemon...');
        try {
            await stopDaemon();
            process.exit(0);
        } catch (error) {
            console.error('❌ Failed to stop daemon:', error.message);
            process.exit(1);
        }
    })

daemon.command('disable')
    .description('Disable the daemon')
    .action(async () => {
        const { setDaemon } = await import('../src/cli/daemon/set.mjs');
        try {
            await setDaemon(false);
            console.log('😴 Daemon disabled successfully!');
            process.exit(0);
        } catch (error) {
            console.error('❌ Failed to disable daemon:', error.message);
            process.exit(1);
        }
    });

daemon.command('enable')
    .description('Enable the daemon')
    .action(async () => {
        const { setDaemon } = await import('../src/cli/daemon/set.mjs');
        try {
            await setDaemon(true);
            console.log('🚀 Daemon enabled successfully!');
            process.exit(0);
        } catch (error) {
            console.error('❌ Failed to enable daemon:', error.message);
            process.exit(1);
        }
    });

daemon.command('state')
    .description('Check the daemon state')
    .action(async () => {
        const { checkState } = await import('../src/cli/daemon/state.mjs');
        console.log('Checking daemon state...');
        try {
            await checkState();
            process.exit(0);
        } catch (error) {
            console.error('❌ Failed to check daemon state:', error.message);
            process.exit(1);
        }
    })

daemon.command('config')
    .description('Check the current daemon config')
    .action(async () => {
        const { getDaemonConfig } = await import('../src/cli/daemon/config.mjs');
        try {
            getDaemonConfig();
            process.exit(0);
        } catch (error) {
            console.error('❌ Failed to check daemon config:', error.message);
            process.exit(1);
        }
    })


// Add the commands to the main program
program.addCommand(auth);
program.addCommand(room);
program.addCommand(daemon);
program
    .version('1.0.0')
    .description('Matrix CLI Tool')
    .option('-d, --debug', 'Enable debug mode', false)
    .option('-v, --verbose', 'Enable verbose output', false);

program.parse();
