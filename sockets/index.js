const jwt = require('jsonwebtoken');
const User = require('../models').User;

const afterConnection = (io, socket) => {
    console.log('authenticated socket');
    socket.on('client', (msg) => {
        socket.broadcast.emit('server', msg);
    })
}

const authSocket = async (io, socket) => {
    console.log('on connection');
    try {
        const token = socket.handshake.auth.token
        if (!token) {
            return socket.emit('error', { message: 'Unauthorized' })
        }
        const result = await jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findByPk(result.id)
        if (!user) {
            return socket.emit('error', { message: 'Unauthorized' })
        }
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