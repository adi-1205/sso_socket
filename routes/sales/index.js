const express = require('express');
const router = express.Router();

const controller = require('./index.controller');

router.get('/',controller.getPlan)

module.exports = router;