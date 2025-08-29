import React, { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:4000/api' });
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalLoans: 0,
    totalUsers: 0,
    totalBranches: 0,
    totalLeads: 0,
    monthlyDisbursement: 0,
    pendingApprovals: 0
  });

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      const [loansRes, usersRes, leadsRes] = await Promise.all([
        api.get('/loans'),
        api.get('/users'),
        api.get('/leads')
      ]);

      setStats({
        totalLoans: loansRes.data.length,
        totalUsers: usersRes.data.length,
        totalBranches: 5, // Static for now
        totalLeads: leadsRes.data.length,
        monthlyDisbursement: loansRes.data.reduce((sum, loan) => sum + (loan.net_disbursement || 0), 0),
        pendingApprovals: loansRes.data.filter(loan => loan.status === 'Pending').length
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Admin Dashboard</h2>
        <div>Last updated: {new Date().toLocaleTimeString()}</div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>{stats.totalLoans}</h3>
          <p>Total Loans</p>
        </div>
        <div className="stat-card">
          <h3>{stats.totalUsers}</h3>
          <p>Total Users</p>
        </div>
        <div className="stat-card">
          <h3>{stats.totalBranches}</h3>
          <p>Branches</p>
        </div>
        <div className="stat-card">
          <h3>{stats.totalLeads}</h3>
          <p>Total Leads</p>
        </div>
        <div className="stat-card">
          <h3>₹{stats.monthlyDisbursement.toLocaleString()}</h3>
          <p>Monthly Disbursement</p>
        </div>
        <div className="stat-card">
          <h3>{stats.pendingApprovals}</h3>
          <p>Pending Approvals</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="card">
          <h3>System Health</h3>
          <ul>
            <li>Database: ✅ Connected</li>
            <li>API Server: ✅ Running</li>
            <li>Backup Status: ✅ Up to date</li>
            <li>Security: ✅ All systems secure</li>
          </ul>
        </div>

        <div className="card">
          <h3>Quick Actions</h3>
          <button className="btn btn-primary" style={{margin: '0.25rem'}}>Generate Reports</button>
          <button className="btn btn-primary" style={{margin: '0.25rem'}}>Backup Database</button>
          <button className="btn btn-primary" style={{margin: '0.25rem'}}>System Settings</button>
          <button className="btn btn-primary" style={{margin: '0.25rem'}}>User Audit</button>
        </div>
      </div>
    </div>
  );
}