const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');
const express=require("express");
const socketio=require('socket.io');
const http=require('http');
const cors=require('cors');
const {addUser, removeUser, getUser,getUsersInRoom}= require('./users.js');

const PORT=process.env.PORT || 5000;
const router=require('./router')
const app=express();
const server=http.createServer(app);
const io=socketio(server);
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
app.use(cors());

io.on('connection', (socket)=>{
socket.on('join', ({name, room}, callback)=>{
  const {error, user} =addUser({id:socket.id, name,room});
  if(error) return callback(error);
  socket.emit('message', {user:'admin', text:`${user.name}, welcome to room ${user.room}`});
  socket.broadcast.to(user.room).emit('message', {user:'admin', text:`${user.name}, has joined!`})
  socket.join(user.room);
  io.to(user.room).emit('roomData', {room:user.room, users:getUsersInRoom(user.room)});
  callback();
})
//user generated message
socket.on('sendMessage', (message, callback)=>{
const user=getUser(socket.id);
io.to(user.room).emit('message', {user:user.name, text:message})
io.to(user.room).emit('roomData', {room:user.room, users:getUsersInRoom(user.room)})
callback();
})

socket.on('disconnect', ()=>{
  const user=removeUser(socket.id);
  if (user) {
    io.to(user.room).emit('message', {user:'admin', text:`${user.name} has left.`})
    
  }
})
});

app.use(router);
const startServer = async () => {
  await Promise.all([
    pubClient.connect(),
    subClient.connect(),
  ]);

  io.adapter(createAdapter(pubClient, subClient));

  server.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
    console.log('connected to Redis');
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});