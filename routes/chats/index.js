const express = require('express');
const router = express.Router();

const controller = require('./index.controller');

router.get('/room/:access',controller.getRoom)
router.get('/rooms',controller.getRooms)
router.post('/rooms',controller.postCreateRoom)
router.delete('/rooms',controller.deleteRoom)

// router.get('/room',controller.getChat)
module.exports = router;