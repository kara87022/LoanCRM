import React from 'react';

export default function NotificationPanel({ isOpen, onClose }) {
  if (!isOpen) return null;

  const notifications = [
    { id: 1, message: 'New loan application received', time: '2 mins ago' },
    { id: 2, message: 'Payment overdue for Loan L001', time: '1 hour ago' },
    { id: 3, message: 'Document verification completed', time: '3 hours ago' }
  ];

  return (
    <div className="notification-panel" style={{
      position: 'fixed',
      top: '60px',
      right: '20px',
      width: '300px',
      backgroundColor: 'white',
      border: '1px solid #ccc',
      borderRadius: '5px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      zIndex: 1000
    }}>
      <div style={{ padding: '15px', borderBottom: '1px solid #eee' }}>
        <h6>Notifications</h6>
        <button onClick={onClose} style={{ float: 'right', border: 'none', background: 'none' }}>×</button>
      </div>
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {notifications.map(notif => (
          <div key={notif.id} style={{ padding: '10px', borderBottom: '1px solid #f0f0f0' }}>
            <p style={{ margin: 0, fontSize: '14px' }}>{notif.message}</p>
            <small style={{ color: '#666' }}>{notif.time}</small>
          </div>
        ))}
      </div>
    </div>
  );
}