const express = require('express');
const router = express.Router();
const createSSEChatHandler = require('../controllers/chatController');

const chatHandler = createSSEChatHandler();

router.get('/messages', chatHandler.handleSSEConnection);
router.post('/messages', chatHandler.sendMessage);
router.get('/messages/history', chatHandler.getMessageHistory);
router.get('/health', chatHandler.getHealthStatus);

module.exports = router;