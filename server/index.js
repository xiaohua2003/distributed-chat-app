const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');

const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const cors = require('cors');

const {
  connectUserStore,
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require('./users.js');

const {
  initializeDatabase,
  saveMessage,
  getRecentMessages,
} = require('./db.js');


const router = require('./router');

const PORT = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(cors());
app.use(router);

// Redis clients used by Socket.IO for cross-server messaging
const pubClient = createClient({
  url: 'redis://localhost:6379',
});

const subClient = pubClient.duplicate();

pubClient.on('error', (err) => {
  console.error('Redis publisher error:', err);
});

subClient.on('error', (err) => {
  console.error('Redis subscriber error:', err);
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // User joins a room
  socket.on('join', async ({ name, room }, callback) => {
    try {
      const { error, user } = await addUser({
        id: socket.id,
        name,
        room,
      });

      if (error) {
        return callback(error);
      }

      socket.join(user.room);

      socket.join(user.room);

      const history = await getRecentMessages(user.room);

      history.forEach((item) => {
        socket.emit('message', {
          user: item.username,
          text: item.message,
        });
      });

      socket.emit('message', {
        user: 'admin',
        text: `${user.name}, welcome to room ${user.room}`,
      });

      // Welcome the user who just joined
      socket.emit('message', {
        user: 'admin',
        text: `${user.name}, welcome to room ${user.room}`,
      });

      // Notify everyone else in the room
      socket.broadcast.to(user.room).emit('message', {
        user: 'admin',
        text: `${user.name} has joined!`,
      });

      // Get the shared room user list from Redis
      const users = await getUsersInRoom(user.room);

      io.to(user.room).emit('roomData', {
        room: user.room,
        users,
      });

      callback();
    } catch (err) {
      console.error('Join error:', err);
      callback('Unable to join room');
    }
  });

  // User-generated message
socket.on('sendMessage', async (message, callback) => {
  try {
    const user = await getUser(socket.id);

    if (!user) {
      return callback();
    }

    await saveMessage({
      room: user.room,
      username: user.name,
      message,
    });

    io.to(user.room).emit('message', {
      user: user.name,
      text: message,
    });

    const users = await getUsersInRoom(user.room);

    io.to(user.room).emit('roomData', {
      room: user.room,
      users,
    });

    callback();
  } catch (err) {
    console.error('Send message error:', err);
    callback();
  }
});

  // User disconnects
  socket.on('disconnect', async () => {
    try {
      const user = await removeUser(socket.id);

      if (user) {
        io.to(user.room).emit('message', {
          user: 'admin',
          text: `${user.name} has left.`,
        });

        const users = await getUsersInRoom(user.room);

        io.to(user.room).emit('roomData', {
          room: user.room,
          users,
        });
      }

      console.log(`Client disconnected: ${socket.id}`);
    } catch (err) {
      console.error('Disconnect error:', err);
    }
  });
});

const startServer = async () => {
  await Promise.all([
    pubClient.connect(),
    subClient.connect(),
    connectUserStore(),
    initializeDatabase(),
  ]);

  // Allows Socket.IO events to propagate across server instances
  io.adapter(createAdapter(pubClient, subClient));

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('Connected to Redis');
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});