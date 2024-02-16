const crypto = require('node:crypto');
const slugify = require('slugify');

const Room = require('../../models').Room;
const { ReE, range } = require('../../helpers/index');

module.exports.getChat = (req, res, next) => {
    try {
        res.render('chats/room', {
            isAuth: req.session?.user,
        })
    } catch (err) {
        console.log(err)
        return ReE(res, { message: 'something went wrong' }, 400)
    }
}

module.exports.getRooms = async (req, res, next) => {

    try {

        let query = req.query
        let limit = 5;
        let offset = 0;

        if (query.page && !isNaN(parseInt(query.page)) && parseInt(query.page) > 1) {
            offset = (query.page - 1) * limit
        }

        let { rows: rooms, count } = await Room.findAndCountAll({
            where: {
                creator_user_id: req.session.user.id
            },
            offset,
            limit,
            raw: true,
            order: [['createdAt', 'desc']]
        })

        let roomRange = range(offset + 1, offset + 1 + rooms.length + 1)

        rooms = rooms.map((room, index) => {
            return {
                name: room.room_name,
                access_code: room.slug,
                index: roomRange[index]
            }
        })

        if (req.xhr) {
            return res.render('partials/chats/room-list', {
                layout: false,
                rooms,
                count,
            })
        }

        return res.render('chats/rooms', {
            isAuth: req.session?.user,
            chatRoomsPage: true,
            rooms,
            count
        })

    } catch (err) {
        console.log(err)
        return ReE(res, { message: 'something went wrong' }, 400)
    }
}

module.exports.deleteRoom = async (req, res, next) => {

    try {

        const { access } = req.body

        await Room.destroy({
            where: {
                slug: access,
                creator_user_id: req.session?.user.id
            }
        })

        return ReS(res, 'Room deleted', {}, 200)

    } catch (err) {
        console.log(err)
        return ReE(res, { message: 'something went wrong' }, 400)
    }
}

module.exports.postCreateRoom = async (req, res, next) => {
    try {
        const { name } = req.body
        if (!name) return ReE(res, { message: 'Room name can not be empty' }, 400)
        const access_code = crypto.randomBytes(8).toString("hex");
        const slug = slugify(`${name}-${access_code}`, {
            strict: true,
            lower: true,
            replacement: '-',
            trim: true
        })

        const room = await Room.create({
            room_name: name,
            creator_user_id: req.session.user.id,
            access_code,
            slug
        })

        return ReS(res, 'Room created', {}, 200)
        // return ReE(res, 'Room created', 400)

    } catch (err) {
        console.log(err)
        if (err.name === 'SequelizeUniqueConstraintError') {
            return ReE(res, { message: 'hmm, try after sometime or diffrent room name ;)' }, 400)
        }
        return ReE(res, { message: 'something went wrong' }, 400)
    }
}

module.exports.getRoom = async (req, res, next) => {

    try {
        const { access } = req.params
        res.render('chats/room', {
            isAuth: req.session?.user,
            access
        })

    } catch (err) {
        console.log(err)
        return ReE(res, { message: 'something went wrong' }, 400)
        //res.status(400).json({message:'something went wrong'})
    }
}