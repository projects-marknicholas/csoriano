const { EventEmitter } = require('events');
const mongoose = require('mongoose');

const createSSEChatHandler = () => {
  const clients = new Map(); 
  const eventEmitter = new EventEmitter();

  // Message schema
  const messageSchema = new mongoose.Schema({
    message: String,
    user: String,
    projectId: String,
    timestamp: String,
    file: String,
  }, { timestamps: true });

  const Message = mongoose.model('Message', messageSchema);

  // SSE connection handler
  const handleSSEConnection = (req, res) => {
    const { projectId } = req.query;
    
    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE connection established' })}\n\n`);

    // Store this client connection
    if (!clients.has(projectId)) {
      clients.set(projectId, []);
    }
    clients.get(projectId).push(res);

    // Remove client when connection closes
    req.on('close', () => {
      const projectClients = clients.get(projectId);
      if (projectClients) {
        const index = projectClients.indexOf(res);
        if (index > -1) {
          projectClients.splice(index, 1);
        }
        if (projectClients.length === 0) {
          clients.delete(projectId);
        }
      }
      res.end();
    });
  };

  // Send message handler
  const sendMessage = async (req, res) => {
    try {
      const { message, user, projectId, timestamp, file } = req.body;

      if (!message && !file) {
        return res.status(400).json({ error: 'Message or file is required' });
      }
      if (!user) {
        return res.status(400).json({ error: 'User is required' });
      }
      if (!projectId) {
        return res.status(400).json({ error: 'projectId is required' });
      }

      // Save message to database
      const newMessage = new Message({
        message,
        user,
        projectId,
        timestamp: timestamp || new Date().toLocaleTimeString(),
        file,
      });

      const savedMessage = await newMessage.save();

      // Broadcast message to all clients in the same project
      broadcastMessage(projectId, savedMessage);

      res.status(201).json(savedMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Broadcast message to clients
  const broadcastMessage = (projectId, messageData) => {
    const projectClients = clients.get(projectId);
    if (projectClients) {
      const sseData = {
        type: 'message',
        ...messageData.toObject ? messageData.toObject() : messageData
      };

      projectClients.forEach(client => {
        try {
          client.write(`data: ${JSON.stringify(sseData)}\n\n`);
        } catch (error) {
          console.error('Error sending message to client:', error);
        }
      });
    }
  };

  // Get message history
  const getMessageHistory = async (req, res) => {
    try {
      const { projectId } = req.query;
      
      if (!projectId) {
        return res.status(400).json({ error: 'projectId is required' });
      }

      const messages = await Message.find({ projectId })
        .sort({ createdAt: 1 })
        .limit(100);

      res.json(messages);
    } catch (error) {
      console.error('Error fetching message history:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Health check
  const getHealthStatus = (req, res) => {
    res.json({ 
      status: 'OK', 
      connectedProjects: Array.from(clients.keys()).length,
      totalClients: Array.from(clients.values()).reduce((sum, arr) => sum + arr.length, 0)
    });
  };

  return {
    handleSSEConnection,
    sendMessage,
    getMessageHistory,
    getHealthStatus,
    broadcastMessage,
    clients,
    Message
  };
};

module.exports = createSSEChatHandler;