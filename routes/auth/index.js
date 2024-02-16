const express = require('express');
const passport = require('passport');
const router = express.Router();

const controller = require('./index.controller');

const { validateRegister } = require('../../middlewares/validation');
const { ReE } = require('../../helpers');

router.get('/login', controller.getLogin)
router.post('/login', controller.postLogin)

router.get('/register', controller.getRegister)
router.post('/register', validateRegister(), controller.postRegister)

router.get('/logout', controller.getLogout)

router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}))

router.get('/google/redirect', passport.authenticate('google', { session: false }), controller.getAfterLoginGoogle)

router.get('/google/failure', (req, res, next) => {
    return ReE(res, { message: 'Can not login with google, something went wrong' }, 400)
})

module.exports = router;