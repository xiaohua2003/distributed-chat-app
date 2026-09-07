const { io } = require('socket.io-client');

const SERVER_URL = 'http://localhost:8080';

const CLIENT_COUNT = 50;

// Give every test run a brand-new room.
// This prevents old PostgreSQL history from affecting the test.
const ROOM = `load-test-${Date.now()}`;

let connectedCount = 0;
let joinedCount = 0;
let sentCount = 0;
let receivedCount = 0;
let errorCount = 0;

const clients = [];

const startTime = Date.now();

console.log(`Starting load test with ${CLIENT_COUNT} clients`);
console.log(`Room: ${ROOM}`);
console.log('--------------------------------');

for (let i = 0; i < CLIENT_COUNT; i += 1) {
  const username = `loaduser${i}`;

  const socket = io(SERVER_URL, {
    transports: ['websocket'],
  });

  clients.push(socket);

  socket.on('connect', () => {
    connectedCount += 1;

    socket.emit(
      'join',
      {
        name: username,
        room: ROOM,
      },
      (error) => {
        if (error) {
          console.error(`${username} join error:`, error);
          errorCount += 1;
          return;
        }

        joinedCount += 1;

        if (joinedCount === CLIENT_COUNT) {
          console.log(
            `All ${CLIENT_COUNT} clients joined successfully`
          );

          sendMessages();
        }
      }
    );
  });

  socket.on('message', (message) => {
    // Ignore admin/system messages.
    if (
      message.user &&
      message.user.startsWith('loaduser')
    ) {
      receivedCount += 1;
    }
  });

  socket.on('connect_error', (error) => {
    console.error(
      `${username} connection error:`,
      error.message
    );

    errorCount += 1;
  });
}

function sendMessages() {
  console.log('Sending one message from every client...');

  clients.forEach((socket, index) => {
    socket.emit(
      'sendMessage',
      `Load test message ${index}`,
      () => {
        sentCount += 1;

        if (sentCount === CLIENT_COUNT) {
          console.log(
            `All ${CLIENT_COUNT} messages acknowledged`
          );

          // Give Redis/Socket.IO time to deliver everything.
          setTimeout(printResults, 3000);
        }
      }
    );
  });
}

function printResults() {
  const elapsedSeconds =
    (Date.now() - startTime) / 1000;

  const expectedMessages =
    CLIENT_COUNT * CLIENT_COUNT;

  console.log('');
  console.log('========== LOAD TEST RESULTS ==========');
  console.log(`Clients requested: ${CLIENT_COUNT}`);
  console.log(`Connected:         ${connectedCount}`);
  console.log(`Joined:            ${joinedCount}`);
  console.log(`Messages sent:     ${sentCount}`);
  console.log(`Messages received: ${receivedCount}`);
  console.log(`Expected received: ${expectedMessages}`);
  console.log(`Errors:            ${errorCount}`);
  console.log(
    `Elapsed time:      ${elapsedSeconds.toFixed(2)} sec`
  );
  console.log('=======================================');

  clients.forEach((socket) => {
    socket.disconnect();
  });

  process.exit(0);
}