
const bcrypt = require('bcryptjs');

const { ReS, ReE } = require('../../helpers/index');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../../models').User;

module.exports.getRegister = (req, res, next) => {
    try {
        res.render('auth/register')
    } catch (err) {
        console.log(err)
        ReE(res, { message: 'something went wrong' }, 400)
    }
}

module.exports.postRegister = async (req, res, next) => {
    try {
        let { errors } = validationResult(req)
        if (errors.length) {
            ReE(res, errors[0].msg, 400)
        }

        let email = req.body.email.trim()
        let username = req.body.username.trim()
        let password = req.body.password.trim()

        let emailExist = await User.findOne({ where: { email } })
        if (emailExist) {
            return ReE(res, { message: 'Email already exist' }, 400)
        }

        let user = await User.create({
            username,
            email,
            password: await bcrypt.hash(password, 12)
        })

        return ReS(res, 'Registration successfull', {}, 200)

    } catch (err) {
        console.log(err)
        ReE(res, { message: 'something went wrong' }, 400)
    }
}

module.exports.getLogin = (req, res, next) => {
    try {
        res.render('auth/login')
    } catch (err) {
        console.log(err)
        ReE(res, { message: 'something went wrong' }, 400)
    }
}

module.exports.postLogin = async (req, res, next) => {

    try {

        const { email, password } = req.body

        if (!email || !password) ReE(res, { message: 'Provide all fields' }, 400)
        let user = await User.findOne({ where: { email: email.trim() } })

        if (!user) return ReE(res, { message: 'Invalid email or password' }, 400)

        if (!await bcrypt.compare(password, user.password)) ReE(res, { message: 'Invalid email or password' }, 400)

        const token = await jwt.sign({
            id: user.id,
            email: user.email
        }, process.env.JWT_SECRET)

        res.cookie('auth', token, { maxAge: process.env.JWT_EXPIRATION })
        res.cookie('username', user.username, { maxAge: process.env.JWT_EXPIRATION })
        return ReS(res, 'Login successfull', {}, 200)

    } catch (err) {
        console.log(err)
        ReE(res, { message: 'something went wrong' }, 400)
    }
}

module.exports.getLogout = (req, res, next) => {

    try {
        if (req.session.user) {
            req.session.destroy()
            req.logout(() => {
                res.cookie('auth', '', { maxAge: -1 })
                res.redirect('/')
            })
        }
    } catch (err) {
        console.log(err)
        ReE(res, { message: 'something went wrong' }, 400)
    }
}

module.exports.getAfterLoginGoogle = async (req, res, next) => {
    try {
        const token = await jwt.sign({
            id: req.user.id,
            email: req.user.email
        }, process.env.JWT_SECRET)

        res.cookie('auth', token, { maxAge: process.env.JWT_EXPIRATION })
        res.cookie('username', req.user.username, { maxAge: process.env.JWT_EXPIRATION })
        return res.redirect('/')

    } catch (err) {
        console.log(err)
        ReE(res, { message: 'something went wrong' }, 400)
    }
}