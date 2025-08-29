import React, { useState } from 'react';

export default function ChatPanel({ isOpen, onClose }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, sender: 'System', text: 'Welcome to support chat!', time: '10:00 AM' }
  ]);

  const sendMessage = () => {
    if (message.trim()) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'You',
        text: message,
        time: new Date().toLocaleTimeString()
      }]);
      setMessage('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="chat-panel" style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '300px',
      height: '400px',
      backgroundColor: 'white',
      border: '1px solid #ccc',
      borderRadius: '5px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ padding: '15px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
        <h6>Support Chat</h6>
        <button onClick={onClose} style={{ border: 'none', background: 'none' }}>×</button>
      </div>
      <div style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ marginBottom: '10px' }}>
            <strong>{msg.sender}:</strong> {msg.text}
            <br />
            <small style={{ color: '#666' }}>{msg.time}</small>
          </div>
        ))}
      </div>
      <div style={{ padding: '10px', borderTop: '1px solid #eee', display: 'flex' }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          style={{ flex: 1, marginRight: '10px', padding: '5px' }}
        />
        <button onClick={sendMessage} className="btn btn-sm btn-primary">Send</button>
      </div>
    </div>
  );
}