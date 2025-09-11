const express = require('express');
const router = express.Router();
const createSSEChatHandler = require('../controllers/chatController');

const chatHandler = createSSEChatHandler();

router.get('/messages', chatHandler.handleSSEConnection);
router.get('/notifications', chatHandler.handleNotificationConnection);
router.post('/messages', chatHandler.sendMessage);
router.get('/messages/history', chatHandler.getMessageHistory);
router.get('/notifications/list', chatHandler.getNotifications);
router.patch('/notifications/:notificationId/read', chatHandler.markNotificationAsRead);
router.get('/health', chatHandler.getHealthStatus);

module.exports = router;