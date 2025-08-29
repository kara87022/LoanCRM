import React, { useState } from 'react';

export default function NotificationPreferences() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: false,
    loanApproval: true,
    paymentReminders: true,
    overdueAlerts: true
  });

  return (
    <div>
      <div className="page-header">
        <h2>Notification Preferences</h2>
      </div>

      <div className="card">
        <h3>Notification Channels</h3>
        <div className="form-group">
          <label>
            <input type="checkbox" checked={settings.emailNotifications}
              onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})} />
            Email Notifications
          </label>
        </div>
        <div className="form-group">
          <label>
            <input type="checkbox" checked={settings.smsNotifications}
              onChange={(e) => setSettings({...settings, smsNotifications: e.target.checked})} />
            SMS Notifications
          </label>
        </div>
        <div className="form-group">
          <label>
            <input type="checkbox" checked={settings.pushNotifications}
              onChange={(e) => setSettings({...settings, pushNotifications: e.target.checked})} />
            Push Notifications
          </label>
        </div>
      </div>

      <div className="card">
        <h3>Event Notifications</h3>
        <div className="form-group">
          <label>
            <input type="checkbox" checked={settings.loanApproval}
              onChange={(e) => setSettings({...settings, loanApproval: e.target.checked})} />
            Loan Approval/Rejection
          </label>
        </div>
        <div className="form-group">
          <label>
            <input type="checkbox" checked={settings.paymentReminders}
              onChange={(e) => setSettings({...settings, paymentReminders: e.target.checked})} />
            Payment Reminders
          </label>
        </div>
        <div className="form-group">
          <label>
            <input type="checkbox" checked={settings.overdueAlerts}
              onChange={(e) => setSettings({...settings, overdueAlerts: e.target.checked})} />
            Overdue Alerts
          </label>
        </div>
        <button className="btn btn-success">Save Preferences</button>
      </div>
    </div>
  );
}