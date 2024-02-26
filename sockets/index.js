const jwt = require('jsonwebtoken');
const cookie = require('cookie');

const User = require('../models').User;
const Room = require('../models').Room;
const Chat = require('../models').Chat;
const MessageSeenBy = require('../models').MessageSeenBy;


const { RoomMap, timeTOChatTime } = require('../helpers');

const rooms = new RoomMap()

const afterConnection = (io, socket) => {
    try {
        socket.on('join room', async ({ room }) => {
            let isNewUser = rooms.addOnlineUser({ room, socket })

            if (!isNewUser) return socket.emit('error', { message: 'Already connected' })

            socket.join(room)

            await addUserToRoomDB({ room_slug: room, socket })

            socket.to(room).emit('user joined', {
                username: socket.locals.user.username,
                users: rooms.getOnlineUsers(room)
            })

            socket.emit('active users', {
                users: rooms.getOnlineUsers(room)
            })

            loadPreviousChats({ socket, room_slug: room })
        })

        socket.on('message', async (payload) => {

            let chat_id = await saveMessageTODB({ socket, payload })

            socket.to(payload.room).emit('server', { ...payload, chat_id });
            socket.emit('sent message id', payload.message, chat_id)
        })

        socket.on('get seen by', async (chat_id, room) => {
            let usernames = await getSeenBy(socket, chat_id, room)
            socket.emit('seen by users', usernames)
        })

        socket.on('mark seen', (chat_ids) => markAllMessagesSeen(socket, chat_ids))

        socket.on('message image', (payload) => {

            let fileSize = Buffer.from(payload.message, 'base64').toString().length;

            if (fileSize > 1024 * 1024 * 8) {
                return socket.emit('error', { message: 'File size shoulb be less then 8MB' })
            }

            socket.to(payload.room).emit('server image', payload);
        })

        socket.on('get extra messages', ({ page, room }) => {

            let pg = parseInt(page)

            if (!isNaN(pg) && pg >= 1) {
                retrievePreviousChats({ socket, room_slug: room, offset: (page - 1) * 20 })
            }
        })

        socket.on("disconnecting", () => {
            let [socket_id, room] = socket.rooms

            rooms.removeOnlineUser({ socket_id, room })

            socket.broadcast.emit('user left', {
                username: socket.locals.user.username,
                users: rooms.getOnlineUsers(room)
            })

        });
    } catch (err) {

        console.log(err);
        return socket.emit('error', { message: 'Something went wrong' })
    }
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

async function saveMessageTODB({ socket, payload }) {
    try {

        let room = await Room.findOne({ where: { slug: payload.room } })
        if (!room) return socket.emit('error', { message: 'Room no longer exist!' })

        let chat = await Chat.create({
            message: payload.message,
            sender_username: socket.locals.user.username,
            sender_id: socket.locals.user.id,
            room_id: room.id
        })

        return chat.id

    } catch (err) {
        console.log(err);
    }
}

async function loadPreviousChats({ socket, room_slug }) {
    try {

        let room = await Room.findOne({ where: { slug: room_slug } })
        if (!room) return socket.emit('error', { message: 'Room no longer exist!' })

        let result = await Chat.findAll({
            where: {
                room_id: room.id,
            },
            limit: 20,
            order: [['createdAt', 'desc']],
            raw: true
        })

        let chats = result.map((c) => {

            return {
                id: c.id,
                message: c.message,
                username: c.sender_id == socket.locals.user.id ? 'You' : c.sender_username,
                time: timeTOChatTime(c.createdAt)
            }
        })
        socket.emit('preveious chats', chats)
    } catch (err) {
        console.log(err);
    }
}

async function retrievePreviousChats({ socket, room_slug, offset = 0 }) {
    try {

        let room = await Room.findOne({ where: { slug: room_slug } })
        if (!room) return socket.emit('error', { message: 'Room no longer exist!' })

        let result = await Chat.findAll({
            where: {
                room_id: room.id,
            },
            limit: 20,
            offset: offset,
            order: [['createdAt', 'desc']],
            raw: true
        })

        // await

        let chats = result.map((c) => {

            return {
                id: c.id,
                message: c.message,
                username: c.sender_id == socket.locals.user.id ? 'You' : c.sender_username,
                time: timeTOChatTime(c.createdAt)
            }
        })
        socket.emit('retrieve preveious chats', chats)
    } catch (err) {
        console.log(err);
    }
}

async function addUserToRoomDB({ room_slug, socket }) {
    try {

        let room = await Room.findOne({
            where: {
                slug: room_slug
            }
        })

        await room.addUserToRoom(socket.locals.user.id, socket.locals.user.username)

    } catch (err) {
        console.log(err);
        return socket.emit('error', { message: 'Something went wrong' })
    }
}
async function markAllMessagesSeen(socket, chat_ids = []) {
    try {
        for (let i = 0; i < chat_ids.length; i++) {
            await markMessageSeen(socket, chat_ids[i]);
        }
    } catch (err) {
        console.error(err);
    }
}
async function markMessageSeen(socket, chat_id) {
    try {
        await MessageSeenBy.findOrCreate({
            where: {
                chat_id,
                user_id: socket.locals.user.id
            },
            defaults: {
                chat_id,
                user_id: socket.locals.user.id,
                username: socket.locals.user.username
            }
        })
    } catch (err) {
        console.log(err);
    }
}

async function getSeenBy(socket, chat_id, room_slug) {
    try {
        let seenByRaw = await MessageSeenBy.findAll({
            where: { chat_id },
            attributes: ['user_id'],
            raw: true
        })

        let seenBy = seenByRaw.map(sb => sb.user_id)

        let allUsersJSON = await Room.findOne({ where: { slug: room_slug }, attributes: ['joined_users'], raw: true }) || '[]'
        let allUsers = JSON.parse(allUsersJSON.joined_users)

        seenByUsers = allUsers.map((user) => {
            if (user.user_id != socket.locals.user.id) {
                return {
                    username: user.username,
                    seen: seenBy.includes(user.user_id)
                }
            } else {
                return {
                    username: false,
                    seen: seenBy.includes(user.user_id)
                }
            }
        })

        return seenByUsers
    } catch (err) {
        console.log(err);
    }
}

module.exports = {
    authSocket
}