const express = require('express');
const { getMessages, sendMessage } = require('../controllers/chatController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

// Get messages endpoint
router.get('/:projectId', authMiddleware, getMessages);

// Send message endpoint
router.post('/send', authMiddleware, sendMessage);

module.exports = router;