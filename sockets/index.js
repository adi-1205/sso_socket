const jwt = require('jsonwebtoken');
const cookie = require('cookie');

const User = require('../models').User;
const Room = require('../models').Room;
const { RoomMap } = require('../helpers');

const rooms = new RoomMap()

const afterConnection = (io, socket) => {
    socket.on('join room', ({ room, username }) => {
        let isNewUser = rooms.addOnlineUser(room, {
            username: username,
            socket_id: socket.id
        })
        if (!isNewUser) return socket.emit('error', { message: 'Already connected' })
        socket.join(room)
        socket.to(room).emit('user joined', {
            username,
            users: rooms.getOnlineUsers(room)
        })
        socket.emit('active users', {
            users: rooms.getOnlineUsers(room)
        })
    })

    socket.on('message', (payload) => {
        socket.to(payload.room).emit('server', payload);
    })
    socket.on("disconnecting", () => {
        let [socket_id, room] = socket.rooms
        rooms.removeOnlineUser({ socket_id, room })
        socket.broadcast.emit('user left', {
            username: socket.locals.user.username,
            users: rooms.getOnlineUsers(room)
        })
    });
}

const authSocket = async (io, socket) => {
    try {
        let cookies = cookie.parse(socket.handshake.headers.cookie)
        const token = cookies.auth
        if (!token) {
            return socket.emit('error', { message: 'Unauthorized' })
        }
        const result = await jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findByPk(result.id)
        if (!user) {
            return socket.emit('error', { message: 'Unauthorized' })
        }
        socket.locals = { user }
        afterConnection(io, socket)
    } catch (err) {
        console.log(err);
        if (err instanceof jwt.JsonWebTokenError) {
            return socket.emit('error', { message: 'Invalid token' })
        }
        return socket.emit('error', { message: 'Something went wrong' })
    }
}
module.exports = {
    authSocket
}