const { createClient } = require('redis');

const redisClient = createClient({
  url: 'redis://localhost:6379',
});

redisClient.on('error', (err) => {
  console.error('Redis user store error:', err);
});

const connectUserStore = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};

const addUser = async ({ id, name, room }) => {
  name = name.trim().toLowerCase();
  room = room.trim().toLowerCase();

  const roomUsersKey = `room:${room}:users`;

  // Atomically add username only if it does not already exist.
  const wasAdded = await redisClient.hSetNX(
    roomUsersKey,
    name,
    id
  );

  if (!wasAdded) {
    return { error: 'username is taken' };
  }

  const user = {
    id,
    name,
    room,
  };

  await redisClient.hSet(`user:${id}`, user);

  return { user };
};

const getUser = async (id) => {
  const user = await redisClient.hGetAll(`user:${id}`);

  if (Object.keys(user).length === 0) {
    return undefined;
  }

  return user;
};

const removeUser = async (id) => {
  const user = await getUser(id);

  if (!user) {
    return undefined;
  }

  await redisClient
    .multi()
    .del(`user:${id}`)
    .hDel(`room:${user.room}:users`, user.name)
    .exec();

  return user;
};

const getUsersInRoom = async (room) => {
  const users = await redisClient.hGetAll(
    `room:${room}:users`
  );

  return Object.entries(users).map(([name, id]) => ({
    id,
    name,
    room,
  }));
};

module.exports = {
  connectUserStore,
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
};