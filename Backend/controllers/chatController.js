const Message = require('../models/chatModel');
const User = require('../models/usersModel');

const getMessages = (req, res) => {
  const projectId = req.params.projectId;
  
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Function to send initial messages and keep connection alive
  const sendInitialMessages = async () => {
    try {
      const messages = await Message.find({ projectId })
        .sort({ createdAt: 1 })
        .limit(50)
        .populate('user', 'name email');
      
      const formattedMessages = messages.map(msg => ({
        ...msg.toObject(),
        username: msg.user?.name || msg.user?.email || msg.username,
        timestamp: new Date(msg.createdAt).toLocaleTimeString()
      }));

      // Send initial messages as a single SSE event
      res.write(`event: initial-messages\n`);
      res.write(`data: ${JSON.stringify(formattedMessages)}\n\n`);
    } catch (error) {
      console.error('Error fetching initial messages:', error);
      res.write(`event: error\n`);
      res.write(`data: ${JSON.stringify({ error: 'Failed to fetch messages' })}\n\n`);
    }
  };

  // Send initial messages
  sendInitialMessages();

  // Set up a message change stream
  const changeStream = Message.watch([
    { $match: { 'fullDocument.projectId': projectId } }
  ], { fullDocument: 'updateLookup' });

  // When a new message is added
  changeStream.on('change', async (change) => {
    if (change.operationType === 'insert') {
      try {
        const newMessage = await Message.findById(change.fullDocument._id)
          .populate('user', 'name email');
        
        const formattedMessage = {
          ...newMessage.toObject(),
          username: newMessage.user?.name || newMessage.user?.email || newMessage.username,
          timestamp: new Date(newMessage.createdAt).toLocaleTimeString()
        };

        res.write(`event: new-message\n`);
        res.write(`data: ${JSON.stringify(formattedMessage)}\n\n`);
      } catch (error) {
        console.error('Error processing new message:', error);
      }
    }
  });

  // Handle client disconnect
  req.on('close', () => {
    changeStream.close();
    res.end();
  });
};

const sendMessage = async (req, res) => {
  const { projectId, message, fileUrl, username } = req.body;
  const user = req.user;

  try {
    const newMessage = new Message({
      projectId,
      user: user._id,
      username: username || user.name || user.email,
      message,
      file: fileUrl,
    });

    await newMessage.save();

    res.status(201).json({ 
      success: true, 
      message: {
        ...newMessage.toObject(),
        timestamp: new Date().toLocaleTimeString(),
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      error: 'Failed to send message',
      details: error.message 
    });
  }
};

module.exports = {
  getMessages,
  sendMessage,
};