const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMsg, generateMsgLocation } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirecotryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirecotryPath));

io.on('connection', (socket) => {
    console.log('new Websocket connetion');

    socket.on('join', (options, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options })

        if (error) {
            return callback(error);
        }

        socket.join(user.room);

        socket.emit('message', generateMsg('Admin', 'Welcome!'));
        socket.broadcast.to(user.room).emit('message', generateMsg('Admin', `${user.username} has joined!`));
        io.to(user.room).emit('roomData', { 
            room: user.room,
            users: getUsersInRoom(user.room)
         });

        callback();
    })

    socket.on('sendMessage', (msg, callback) => {
        const filter = new Filter();

        if (filter.isProfane(msg)) {
            return callback('Profanity is not allowed!');
        }

        const user = getUser(socket.id);

        io.to(user.room).emit('message', generateMsg(user.username, msg));
        callback();
    })

    socket.on('sendLocation', (position, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit('locationSent', generateMsgLocation(user.username, `https://google.com/maps?q=${position.latitude},${position.longitude}`));
        callback();
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if (user) {
            io.to(user.room).emit('message', generateMsg('Admin', `${user.username} has left`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}`);
})