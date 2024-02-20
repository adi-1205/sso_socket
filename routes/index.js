const express = require('express');
const router = express.Router();

const controller = require('./index.controller');

const authRoutes = require('./auth/index')
const chatRoutes = require('./chats/index');
const salesRoutes = require('./sales/index');

const Auth = require('../middlewares/auth');
const passport = require('passport');

router.get('/', Auth, controller.getIndex)
router.use('/auth', authRoutes)
router.use('/chats', Auth, chatRoutes)
router.use('/sales', Auth, salesRoutes)

module.exports = router;
