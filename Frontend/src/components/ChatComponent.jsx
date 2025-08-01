import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { BsEmojiSmile, BsFillSendFill } from 'react-icons/bs';
import Picker from 'emoji-picker-react';
import styles from './ChatComponent.module.css';

const SOCKET_URL = 'http://localhost:5000';

const ChatComponent = ({ projectId, user }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [file, setFile] = useState(null);

  useEffect(() => {
    const socketInstance = io(SOCKET_URL);
    socketInstance.emit('join_project', projectId);

    socketInstance.on('receive_message', (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [projectId]);

  const handleSendMessage = () => {
    if (message.trim() || selectedEmoji || file) {
      const timestamp = new Date().toLocaleTimeString();
      const messageData = {
        message: message || selectedEmoji,
        user,
        projectId,
        timestamp,
        file: file ? URL.createObjectURL(file) : null,
      };
      socket.emit('send_message', messageData);
      setMessages((prevMessages) => [...prevMessages, messageData]);
      setMessage('');
      setSelectedEmoji('');
      setFile(null);
    }
  };

  const handleEmojiSelect = (event, emojiObject) => {
    setSelectedEmoji(emojiObject.emoji);
    setEmojiPickerOpen(false);  // Close the emoji picker after selection
  };

  const handleAttachmentClick = () => {
    document.getElementById('fileInput').click();
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  return (
    <>
      {isChatOpen && (
        <div className={styles.chatWindow}>
          <div className={styles.chatHeader}>
            <span>Live Chat</span>
            <div className={styles.status}></div>
            <button onClick={() => setIsChatOpen(false)} className={styles.closeButton}>X</button>
          </div>
          <div className={styles.chatBody}>
            {messages.map((msg, index) => (
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
                          <span>{msg.file}</span>
                        )}
                      </a>
                    </div>
                  )}
                </div>
                <span className={styles.timestamp}>{msg.timestamp}</span>
              </div>
            ))}
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
            />
            <button onClick={handleSendMessage} className={styles.sendButton}>
              <BsFillSendFill />
            </button>
            <button className={styles.emojiButton} onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}>
              <BsEmojiSmile />
            </button>
          </div>
          {emojiPickerOpen && (
            <div className={styles.emojiPicker}>
              <Picker onEmojiClick={handleEmojiSelect} />
            </div>
          )}
        </div>
      )}

      {!isChatOpen && (
        <div className={styles.chatIcon} onClick={() => setIsChatOpen(true)}>
          💬
        </div>
      )}
    </>
  );
};

export default ChatComponent;
