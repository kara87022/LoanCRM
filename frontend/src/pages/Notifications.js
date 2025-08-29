import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../App.css';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:4000/notifications').then((res) => setNotifications(res.data));
  }, []);

  return (
    <div className="main-content">
      <h2 style={{ color: '#1a237e', marginBottom: 24 }}>Notifications</h2>
      <ul className="notification-list">
        {notifications.map((notification) => (
          <li key={notification.id} className="notification-item">
            <p>{notification.message}</p>
            <span>{new Date(notification.date).toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
