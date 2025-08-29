import React, { useState } from 'react';
import '../App.css';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    general: {
      companyName: 'Loan CRM System',
      contactEmail: 'admin@loancrm.com',
      contactPhone: '+91-9876543210',
      address: '123 Business Street, City, State 12345',
      timezone: 'Asia/Kolkata',
      currency: 'INR'
    },
    loan: {
      defaultROI: '20',
      defaultTenure: '100',
      processingFeePercent: '2',
      gstPercent: '18',
      maxLoanAmount: '1000000',
      minLoanAmount: '10000'
    },
    notification: {
      emailNotifications: true,
      smsNotifications: true,
      reminderDays: '3',
      overdueNotifications: true
    },
    security: {
      sessionTimeout: '30',
      passwordExpiry: '90',
      maxLoginAttempts: '3',
      twoFactorAuth: false
    }
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async (section) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert(`${section} settings saved successfully!`);
    } catch (error) {
      alert('Error saving settings');
    }
    setLoading(false);
  };

  const updateSetting = (section, key, value) => {
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [key]: value
      }
    });
  };

  const tabs = [
    { id: 'general', name: 'General' },
    { id: 'loan', name: 'Loan Settings' },
    { id: 'notification', name: 'Notifications' },
    { id: 'security', name: 'Security' }
  ];

  return (
    <div>
      <div className="page-header">
        <h2>System Settings</h2>
      </div>
      
      {/* Tab Navigation */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: '1rem' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ marginRight: '0.5rem', marginBottom: '0.5rem' }}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* General Settings */}
        {activeTab === 'general' && (
          <div>
            <h3>General Settings</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Company Name</label>
                <input
                  type="text"
                  value={settings.general.companyName}
                  onChange={(e) => updateSetting('general', 'companyName', e.target.value)}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Contact Email</label>
                <input
                  type="email"
                  value={settings.general.contactEmail}
                  onChange={(e) => updateSetting('general', 'contactEmail', e.target.value)}
                  className="form-control"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Contact Phone</label>
                <input
                  type="tel"
                  value={settings.general.contactPhone}
                  onChange={(e) => updateSetting('general', 'contactPhone', e.target.value)}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Timezone</label>
                <select
                  value={settings.general.timezone}
                  onChange={(e) => updateSetting('general', 'timezone', e.target.value)}
                  className="form-control"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Address</label>
              <textarea
                value={settings.general.address}
                onChange={(e) => updateSetting('general', 'address', e.target.value)}
                rows={3}
                className="form-control"
              />
            </div>
            <button
              onClick={() => handleSave('General')}
              disabled={loading}
              className="btn btn-success"
            >
              {loading ? 'Saving...' : 'Save General Settings'}
            </button>
          </div>
        )}

        {/* Loan Settings */}
        {activeTab === 'loan' && (
          <div>
            <h3>Loan Settings</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Default ROI (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.loan.defaultROI}
                  onChange={(e) => updateSetting('loan', 'defaultROI', e.target.value)}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Default Tenure (Days)</label>
                <input
                  type="number"
                  value={settings.loan.defaultTenure}
                  onChange={(e) => updateSetting('loan', 'defaultTenure', e.target.value)}
                  className="form-control"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Processing Fee (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.loan.processingFeePercent}
                  onChange={(e) => updateSetting('loan', 'processingFeePercent', e.target.value)}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>GST (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.loan.gstPercent}
                  onChange={(e) => updateSetting('loan', 'gstPercent', e.target.value)}
                  className="form-control"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Maximum Loan Amount</label>
                <input
                  type="number"
                  value={settings.loan.maxLoanAmount}
                  onChange={(e) => updateSetting('loan', 'maxLoanAmount', e.target.value)}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Minimum Loan Amount</label>
                <input
                  type="number"
                  value={settings.loan.minLoanAmount}
                  onChange={(e) => updateSetting('loan', 'minLoanAmount', e.target.value)}
                  className="form-control"
                />
              </div>
            </div>
            <button
              onClick={() => handleSave('Loan')}
              disabled={loading}
              className="btn btn-success"
            >
              {loading ? 'Saving...' : 'Save Loan Settings'}
            </button>
          </div>
        )}

        {/* Notification Settings */}
        {activeTab === 'notification' && (
          <div>
            <h3>Notification Settings</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={settings.notification.emailNotifications}
                  onChange={(e) => updateSetting('notification', 'emailNotifications', e.target.checked)}
                  style={{ marginRight: '0.5rem' }}
                />
                Enable Email Notifications
              </label>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={settings.notification.smsNotifications}
                  onChange={(e) => updateSetting('notification', 'smsNotifications', e.target.checked)}
                  style={{ marginRight: '0.5rem' }}
                />
                Enable SMS Notifications
              </label>
            </div>
            <div className="form-group">
              <label>Reminder Days Before Due</label>
              <input
                type="number"
                value={settings.notification.reminderDays}
                onChange={(e) => updateSetting('notification', 'reminderDays', e.target.value)}
                className="form-control"
                style={{ width: '200px' }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={settings.notification.overdueNotifications}
                  onChange={(e) => updateSetting('notification', 'overdueNotifications', e.target.checked)}
                  style={{ marginRight: '0.5rem' }}
                />
                Enable Overdue Notifications
              </label>
            </div>
            <button
              onClick={() => handleSave('Notification')}
              disabled={loading}
              className="btn btn-success"
            >
              {loading ? 'Saving...' : 'Save Notification Settings'}
            </button>
          </div>
        )}

        {/* Security Settings */}
        {activeTab === 'security' && (
          <div>
            <h3>Security Settings</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Session Timeout (minutes)</label>
                <input
                  type="number"
                  value={settings.security.sessionTimeout}
                  onChange={(e) => updateSetting('security', 'sessionTimeout', e.target.value)}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Password Expiry (days)</label>
                <input
                  type="number"
                  value={settings.security.passwordExpiry}
                  onChange={(e) => updateSetting('security', 'passwordExpiry', e.target.value)}
                  className="form-control"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Max Login Attempts</label>
                <input
                  type="number"
                  value={settings.security.maxLoginAttempts}
                  onChange={(e) => updateSetting('security', 'maxLoginAttempts', e.target.value)}
                  className="form-control"
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginTop: '1.5rem' }}>
                <input
                  type="checkbox"
                  checked={settings.security.twoFactorAuth}
                  onChange={(e) => updateSetting('security', 'twoFactorAuth', e.target.checked)}
                  style={{ marginRight: '0.5rem' }}
                />
                <label>Enable Two-Factor Authentication</label>
              </div>
            </div>
            <button
              onClick={() => handleSave('Security')}
              disabled={loading}
              className="btn btn-success"
            >
              {loading ? 'Saving...' : 'Save Security Settings'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
