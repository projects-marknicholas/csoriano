const { EventEmitter } = require('events');
const mongoose = require('mongoose');

const createSSEChatHandler = () => {
  const clients = new Map(); 
  const notificationClients = new Map();
  const eventEmitter = new EventEmitter();

  // Message schema
  const messageSchema = new mongoose.Schema({
    message: String,
    user: String,
    projectName: String,
    projectId: String,
    timestamp: String,
    file: String,
  }, { timestamps: true });

  // Notification schema
  const notificationSchema = new mongoose.Schema({
    message: String,
    user: String,
    recipient: String,
    projectName: String,
    projectId: String,
    type: { type: String, default: 'message' },
    isRead: { type: Boolean, default: false },
    timestamp: String,
  }, { timestamps: true });

  const Message = mongoose.model('Message', messageSchema);
  const Notification = mongoose.model('Notification', notificationSchema);

  // SSE connection handler for chat
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

  // SSE connection handler for notifications
  const handleNotificationConnection = (req, res) => {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Notification connection established' })}\n\n`);

    // Store this notification client connection
    notificationClients.set(userId, res);

    // Remove client when connection closes
    req.on('close', () => {
      notificationClients.delete(userId);
      res.end();
    });
  };

  // Send message handler
  const sendMessage = async (req, res) => {
    try {
      const { message, user, projectName, projectId, timestamp, file } = req.body;

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
        projectName,
        projectId,
        timestamp: timestamp || new Date().toLocaleTimeString(),
        file,
      });

      const savedMessage = await newMessage.save();

      // Create notification for all users in the project (except the sender)
      const notification = new Notification({
        message: `New message from ${user} in project ${projectName}`,
        user,
        projectName,
        projectId,
        timestamp: new Date().toLocaleTimeString(),
        type: 'message'
      });

      const savedNotification = await notification.save();

      // Broadcast message to all clients in the same project
      broadcastMessage(projectId, savedMessage);

      // Broadcast notification to all connected users
      broadcastNotification(savedNotification);

      res.status(201).json(savedMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Get notifications for a user
  const getNotifications = async (req, res) => {
    try {
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      const notifications = await Notification.find({ 
        $or: [{ recipient: userId }, { recipient: { $exists: false } }] 
      })
        .sort({ createdAt: -1 })
        .limit(50);

      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Mark notification as read
  const markNotificationAsRead = async (req, res) => {
    try {
      const { notificationId } = req.params;
      
      const notification = await Notification.findByIdAndUpdate(
        notificationId,
        { isRead: true },
        { new: true }
      );

      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      res.json(notification);
    } catch (error) {
      console.error('Error marking notification as read:', error);
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

  // Broadcast notification to users
  const broadcastNotification = (notificationData) => {
    const sseData = {
      type: 'notification',
      ...notificationData.toObject ? notificationData.toObject() : notificationData
    };

    // Send to all connected notification clients
    notificationClients.forEach((client, userId) => {
      try {
        client.write(`data: ${JSON.stringify(sseData)}\n\n`);
      } catch (error) {
        console.error('Error sending notification to client:', error);
      }
    });
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
      totalClients: Array.from(clients.values()).reduce((sum, arr) => sum + arr.length, 0),
      notificationClients: notificationClients.size
    });
  };

  return {
    handleSSEConnection,
    handleNotificationConnection,
    sendMessage,
    getMessageHistory,
    getNotifications,
    markNotificationAsRead,
    getHealthStatus,
    broadcastMessage,
    clients,
    Message,
    Notification
  };
};

module.exports = createSSEChatHandler;