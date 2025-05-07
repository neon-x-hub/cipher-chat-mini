#!/usr/bin/env node

const { Command } = require('commander');
const program = new Command();
const initTUI = require('../src/tui/chat');
const SimpleTimeParse = require('../src/utils/simple-time-parse.js');
// Authentication commands
const auth = new Command('auth')
    .description('Authentication commands');

auth.command('login')
    .description('Log in via password/token')
    .action(async () => {
        console.log('Attempting to log in...');
        // Dynamically import the login.mjs
        const { interactiveLogin } = await import('../src/cli/auth/login.mjs');

        try {
            await interactiveLogin();
            console.log('✅ Login successful!');
            process.exit(0);
        } catch (error) {
            console.error('❌ Login failed:', error.message);
            process.exit(1);

        }
    });


auth.command('signup')
    .description('Sign up for a new account')
    .action(async () => {
        console.log('Starting signup process...');
        // Dynamically import the signup.mjs
        const { interactiveSignup } = await import('../src/cli/auth/signup.mjs');

        try {
            await interactiveSignup();
            console.log('✅ Signup successful!');
            process.exit(0);
        } catch (error) {
            console.error('❌ Signup failed:', error.message);
            process.exit(1);
        }
    });

auth.command('logout')
    .description('Clear session')
    .action(() => {
        console.log('Logging out...');
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
    .action(async (roomId) => {
        console.log(`Leaving room ${roomId}...`);
        // Dynamically import the leaveRoom function
        const { leaveRoom } = await import('../src/cli/room/leave.mjs');

        leaveRoom({ roomId })
            .then(() => {
                console.log('✅ Successfully left the room!');
                process.exit(0);
            })
            .catch((error) => {
                console.error('❌ Failed to leave room:', error.message);
                process.exit(1);
            });
    });

room.command('create')
    .description('Create a new Matrix room')
    .requiredOption('-n, --name <name>', 'Name for the new room')
    .option('-p, --public', 'Make room public (default: private)', false)
    .option('-e, --encrypted', 'Make room E2E encrypted (default: false)', false)
    .option('-t, --topic <topic>', 'Room topic/description', '')
    .action(async (opts) => {
        try {
            console.log(`Creating new room "${opts.name}"...`);

            // Dynamically import the createRoom function
            const { createRoom } = await import('../src/cli/room/create.mjs');

            const options = {
                name: opts.name,
                topic: opts.topic,
                public: opts.public,
                encrypted: opts.encrypted,
            };

            console.log("======");

            console.log("Creating room with options: ");
            console.log("Name:", options.name);
            console.log("Topic:", options.topic);
            console.log("Public:", options.public);
            console.log("Encrypted:", options.encrypted);

            console.log("======");



            const roomId = await createRoom(options);

            console.log(`✅ Success! Room created with ID:\n${roomId}`);
            process.exit(0);

        } catch (error) {
            console.error('❌ Room creation failed:', error.message);
            process.exit(1);
        }
    });

room.command('list')
    .description('Show rooms. By default, only joined rooms are shown.')
    .option('-m, --membership <type>', 'Filter by membership: join, invite, leave, all', 'join')
    .action(async (options) => {
        console.log(`Listing rooms with membership: ${options.membership}`);

        const { listRooms } = await import('../src/cli/room/list.mjs');

        try {
            let membership = options.membership;

            // Convert "all" to null to get all rooms
            if (membership === 'all') {
                membership = null;
            }

            const startTime = Date.now();

            await listRooms({ membership });

            console.log(`Done in ${Date.now() - startTime}ms`);

            process.exit(0);
        } catch (err) {
            console.error('Error:', err.message);
            process.exit(1);
        }
    });

room.command('invite')
    .description('Invite a user to a room.')
    .requiredOption('-r, --room-id <roomId>', 'ID of the room to invite the user to')
    .requiredOption('-u, --user-id <userId>', 'ID of the user to invite (e.g., @user:server)')
    .action(async (options) => {
        console.log(`Inviting user ${options.userId} to room ${options.roomId}`);

        const { inviteUser } = await import('../src/cli/room/invite.mjs');

        try {
            const startTime = Date.now();

            const result = await inviteUser({
                roomId: options.roomId,
                userId: options.userId,
            });

            console.log('Invite result:', result);
            console.log(`Done in ${Date.now() - startTime}ms`);

            process.exit(0);
        } catch (err) {
            console.error('Error:', err.message);
            process.exit(1);
        }
    });


room.command('messages <roomId>')
    .description('Fetch messages from a room within a time range')
    .option('-s, --start <date>', 'Start date (ISO format or relative like 7d, 24h)', '7d')
    .option('-e, --end <date>', 'End date (ISO format or relative like now, 1h)', 'now')
    .option('-l, --limit <number>', 'Maximum number of messages to fetch', 100)
    .option('-d, --direction <dir>', 'Pagination direction (b for backward, f for forward)', 'b')
    .action(async (roomId, options) => {
        console.log(`Fetching messages from room ${roomId}`);
        console.log(`Time range: ${options.start} to ${options.end}`);

        const { getMessagesInTimeRange } = await import('../src/cli/chat/get.mjs');

        try {
            const startTime = Date.now();

            const startDate = SimpleTimeParse(options.start);
            const endDate = SimpleTimeParse(options.end);

            console.log(`Fetching messages from ${startDate.toISOString()} to ${endDate.toISOString()} ...`);


            await getMessagesInTimeRange(
                { roomId },
                startDate,
                endDate,
                {
                    limit: parseInt(options.limit),
                    direction: options.direction
                },
                true // Enable logging
            );

            console.log(`Done in ${Date.now() - startTime}ms`);
            process.exit(0);
        } catch (err) {
            console.error('Error:', err.message);
            process.exit(1);
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
    .name('cich')
    .version('1.0.0')
    .description('Minimal, Aeasthetic CLI for Matrix.')
    .option('-d, --debug', 'Enable debug mode', false)
    .option('-v, --verbose', 'Enable verbose output', false);

program.parse();
