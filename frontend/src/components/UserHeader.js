import React from 'react';

export default function UserHeader({ onProfileClick, onNotificationClick, onChatClick }) {
  return (
    <div className="user-header" style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '10px 20px', 
      backgroundColor: '#f8f9fa', 
      borderBottom: '1px solid #dee2e6' 
    }}>
      <div>
        <h4 style={{ margin: 0 }}>Welcome to Loan CRM</h4>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={onNotificationClick} className="btn btn-sm btn-outline-primary">
          🔔 Notifications
        </button>
        <button onClick={onChatClick} className="btn btn-sm btn-outline-primary">
          💬 Chat
        </button>
        <button onClick={onProfileClick} className="btn btn-sm btn-outline-primary">
          👤 Profile
        </button>
      </div>
    </div>
  );
}