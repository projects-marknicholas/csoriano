import React, { useState, useEffect, useRef } from 'react';
import { BsEmojiSmile, BsFillSendFill } from 'react-icons/bs';
import Picker from 'emoji-picker-react';
import styles from './ChatComponent.module.css';

const API_URL = import.meta.env.VITE_LOCAL_URL || 'http://localhost:4000';

const ChatComponent = ({ projectId, user }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [file, setFile] = useState(null);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    if (isChatOpen) {
      // Fetch message history when chat opens
      const fetchMessageHistory = async () => {
        try {
          const response = await fetch(
            `${API_URL}/api/chat/messages/history?projectId=${projectId}`,
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
              },
            }
          );
          if (response.ok) {
            const history = await response.json();
            setMessages(history);
          }
        } catch (error) {
          console.error('Error fetching message history:', error);
        }
      };

      fetchMessageHistory();
      setupSSEConnection();
      
      return () => {
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
      };
    }
  }, [isChatOpen, projectId]);

  const setupSSEConnection = () => {
    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Create new SSE connection with authentication
    const token = localStorage.getItem('token');
    eventSourceRef.current = new EventSource(
      `${API_URL}/api/chat/messages?projectId=${projectId}&token=${token}`
    );

    eventSourceRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'message') {
          setMessages((prevMessages) => [...prevMessages, data]);
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    eventSourceRef.current.onerror = (error) => {
      console.error('SSE connection error:', error);
      // Implement reconnection logic with a delay
      setTimeout(() => {
        if (isChatOpen) {
          setupSSEConnection();
        }
      }, 3000);
    };
  };

  const handleSendMessage = async () => {
    if (message.trim() || selectedEmoji || file) {
      const timestamp = new Date().toLocaleTimeString();
      const messageData = {
        message: message || selectedEmoji,
        user,
        projectId,
        timestamp,
        file: file ? URL.createObjectURL(file) : null,
      };

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/chat/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(messageData),
        });

        if (response.ok) {
          // Message will be added via SSE, no need to add it here
          setMessage('');
          setSelectedEmoji('');
          setFile(null);
        } else {
          console.error('Failed to send message');
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const handleEmojiSelect = (event, emojiObject) => {
    setSelectedEmoji(prev => prev + emojiObject.emoji);
    setEmojiPickerOpen(false);
  };

  const handleAttachmentClick = () => {
    document.getElementById('fileInput').click();
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      // Check file size (limit to 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert('File size too large. Maximum size is 5MB.');
        return;
      }
      setFile(selectedFile);
    }
  };

  return (
    <>
      {isChatOpen && (
        <div className={styles.chatWindow}>
          <div className={styles.chatHeader}>
            <span>Live Chat - Project {projectId}</span>
            <div className={styles.status}></div>
            <button onClick={() => setIsChatOpen(false)} className={styles.closeButton}>X</button>
          </div>
          <div className={styles.chatBody}>
            {messages.length === 0 ? (
              <div className={styles.noMessages}>No messages yet. Start the conversation!</div>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className={msg.user === user ? styles.sent : styles.received}>
                  <div className={styles.messageContent}>
                    <span className={styles.username}>{msg.user}</span>
                    <p>{msg.message}</p>
                    {msg.file && (
                      <div className={styles.attachmentPreview}>
                        <a href={msg.file} target="_blank" rel="noopener noreferrer">
                          {msg.file.split('.').pop() === 'jpg' || msg.file.split('.').pop() === 'png' ? (
                            <img src={msg.file} alt="attachment" className={styles.attachmentImage} />
                          ) : (
                            <span>📎 {msg.file.split('/').pop()}</span>
                          )}
                        </a>
                      </div>
                    )}
                  </div>
                  <span className={styles.timestamp}>{msg.timestamp}</span>
                </div>
              ))
            )}
          </div>
          <div className={styles.chatInput}>
            <button className={styles.attachmentButton} onClick={handleAttachmentClick}>
              📎
              <input
                id="fileInput"
                type="file"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </button>
            <input
              type="text"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={styles.textInput}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage();
                }
              }}
            />
            <button onClick={() => setEmojiPickerOpen(!emojiPickerOpen)} className={styles.emojiButton}>
              <BsEmojiSmile />
            </button>
            <button onClick={handleSendMessage} className={styles.sendButton}>
              <BsFillSendFill />
            </button>
          </div>
          {emojiPickerOpen && (
            <div className={styles.emojiPicker}>
              <Picker onEmojiClick={handleEmojiSelect} />
            </div>
          )}
          {file && (
            <div className={styles.filePreview}>
              <span>Selected: {file.name}</span>
              <button onClick={() => setFile(null)}>✕</button>
            </div>
          )}
        </div>
      )}

      {!isChatOpen && (
        <div className={styles.chatIcon} onClick={() => setIsChatOpen(true)}>
          💬
          {messages.length > 0 && <span className={styles.notificationBadge}>{messages.length}</span>}
        </div>
      )}
    </>
  );
};

export default ChatComponent;