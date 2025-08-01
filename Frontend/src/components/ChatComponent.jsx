import React, { useState, useRef, useEffect } from 'react';
import { BsEmojiSmile, BsFillSendFill } from 'react-icons/bs';
import Picker from 'emoji-picker-react';
import axios from 'axios';
import { EventSourcePolyfill } from 'event-source-polyfill';
import styles from './ChatComponent.module.css';

const ChatComponent = ({ projectId }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const messagesEndRef = useRef(null);
  const eventSourceRef = useRef(null);

  // Get user data from localStorage
  const getUserData = () => {
    const userData = JSON.parse(localStorage.getItem('user'));
    return userData || {};
  };

  // Initialize SSE connection
  const initSSEConnection = () => {
    setLoading(true);
    setError(null);
    
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication required. Please login again.');
      setLoading(false);
      return;
    }

    // Close any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSourcePolyfill(
      `http://localhost:4000/api/chat/${projectId}`, 
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        heartbeatTimeout: 30000,
        withCredentials: true
      }
    );

    eventSource.onopen = () => {
      console.log('SSE connection established');
      setConnectionStatus('connected');
      setError(null);
    };

    eventSource.onerror = (e) => {
      console.error('SSE connection error:', e);
      setConnectionStatus('error');
      
      if (e.status === 401) {
        setError('Session expired. Please refresh the page.');
      } else {
        setError('Connection error. Trying to reconnect...');
      }
      
      // Attempt reconnect after delay
      setTimeout(() => {
        if (isChatOpen && projectId) {
          initSSEConnection();
        }
      }, 3000);
    };

    eventSource.addEventListener('initial-messages', (event) => {
      try {
        const initialMessages = JSON.parse(event.data);
        setMessages(initialMessages);
        setConnectionStatus('connected');
      } catch (err) {
        console.error('Error parsing initial messages:', err);
        setError('Failed to load messages');
      }
      setLoading(false);
    });

    eventSource.addEventListener('new-message', (event) => {
      try {
        const newMessage = JSON.parse(event.data);
        setMessages(prev => [...prev, newMessage]);
      } catch (err) {
        console.error('Error parsing new message:', err);
      }
    });

    eventSourceRef.current = eventSource;
  };

  // Close SSE connection
  const closeSSEConnection = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setConnectionStatus('disconnected');
      console.log('SSE connection closed');
    }
  };

  // Send message to backend
  const sendMessage = async () => {
    if (!message.trim() && !selectedEmoji) return;
    
    const userData = getUserData();
    if (!userData.id) {
      setError('User information not available');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const messageContent = message || selectedEmoji;
      
      await axios.post(
        'http://localhost:4000/api/chat/send',
        {
          projectId,
          message: messageContent,
          user: userData.id,
          username: userData.Username
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setMessage('');
      setSelectedEmoji('');
      setError(null);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle chat open/close and project changes
  useEffect(() => {
    if (isChatOpen && projectId) {
      initSSEConnection();
    } else {
      closeSSEConnection();
      setMessages([]);
    }

    return () => {
      closeSSEConnection();
    };
  }, [isChatOpen, projectId]);

  const handleSendMessage = () => {
    sendMessage();
  };

  const handleEmojiSelect = (event, emojiObject) => {
    setSelectedEmoji(emojiObject.emoji);
    setEmojiPickerOpen(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !emojiPickerOpen) {
      handleSendMessage();
    }
  };

  const isCurrentUser = (msgUser) => {
    const userData = getUserData();
    if (typeof msgUser === 'object') {
      return msgUser._id === userData.id;
    }
    return msgUser === userData.id;
  };

  const formatTimestamp = (timestamp) => {
    if (timestamp) return timestamp;
    
    try {
      return new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  return (
    <>
      {isChatOpen && (
        <div className={styles.chatWindow}>
          <div className={styles.chatHeader}>
            <span>Live Chat</span>
            <div className={`${styles.status} ${styles[connectionStatus]}`} 
                 title={connectionStatus}></div>
            <button 
              onClick={() => setIsChatOpen(false)} 
              className={styles.closeButton}
            >
              ×
            </button>
          </div>
          
          <div className={styles.chatBody}>
            {loading && messages.length === 0 && (
              <div className={styles.loading}>Loading messages...</div>
            )}
            {error && <div className={styles.error}>{error}</div>}
            
            {messages.length === 0 && !loading ? (
              <div className={styles.noMessages}>No messages yet. Start the conversation!</div>
            ) : (
              messages.map((msg) => (
                <div 
                  key={msg._id} 
                  className={isCurrentUser(msg.user) ? styles.sent : styles.received}
                >
                  <div className={styles.messageContent}>
                    <span className={styles.username}>
                      {msg.username}
                    </span>
                    <p>{msg.message}</p>
                  </div>
                  <span className={styles.timestamp}>
                    {formatTimestamp(msg.timestamp)}
                  </span>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className={styles.chatInput}>
            <input
              type="text"
              placeholder="Type your message..."
              value={message || selectedEmoji}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className={styles.textInput}
              disabled={loading}
            />
            
            <button 
              onClick={() => setEmojiPickerOpen(!emojiPickerOpen)} 
              className={styles.emojiButton}
              disabled={loading}
            >
              <BsEmojiSmile />
            </button>
            
            <button 
              onClick={handleSendMessage} 
              className={styles.sendButton}
              disabled={(!message && !selectedEmoji) || loading}
            >
              {loading ? '...' : <BsFillSendFill />}
            </button>
          </div>
          
          {emojiPickerOpen && (
            <div className={styles.emojiPicker}>
              <Picker 
                onEmojiClick={handleEmojiSelect} 
                pickerStyle={{ 
                  width: '100%',
                  boxShadow: 'none',
                  border: '1px solid #ddd'
                }}
              />
            </div>
          )}
        </div>
      )}

      {!isChatOpen && (
        <div 
          className={styles.chatIcon} 
          onClick={() => setIsChatOpen(true)}
        >
          💬
          {messages.length > 0 && (
            <span className={styles.unreadBadge}>
              {messages.filter(msg => !isCurrentUser(msg.user)).length}
            </span>
          )}
        </div>
      )}
    </>
  );
};

export default ChatComponent;