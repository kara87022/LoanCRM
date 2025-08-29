import React, { useEffect, useState } from 'react';
import axios from 'axios';

function OverdueCases() {
  const [overdueCases, setOverdueCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [followUpData, setFollowUpData] = useState({ type: '', notes: '', nextDate: '', status: '' });
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('daysOverdue');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOverdueCases();
  }, []);

  const fetchOverdueCases = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:4000/api/overdue-cases');
      setOverdueCases(response.data);
    } catch (error) {
      console.error('Error fetching overdue cases:', error);
      // Mock data for demo
      setOverdueCases([
        { id: 1, loan_id: 'L001', customer_name: 'John Doe', phone: '9876543210', overdue_amount: 5000, days_overdue: 15, last_payment: '2024-01-15', status: 'contacted', priority: 'high', follow_ups: [] },
        { id: 2, loan_id: 'L002', customer_name: 'Jane Smith', phone: '9876543211', overdue_amount: 3000, days_overdue: 30, last_payment: '2024-01-01', status: 'pending', priority: 'medium', follow_ups: [] },
        { id: 3, loan_id: 'L003', customer_name: 'Bob Wilson', phone: '9876543212', overdue_amount: 7500, days_overdue: 45, last_payment: '2023-12-20', status: 'legal', priority: 'critical', follow_ups: [] }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const addFollowUp = async (caseId) => {
    try {
      await axios.post(`http://localhost:4000/api/overdue-cases/${caseId}/follow-up`, followUpData);
      setFollowUpData({ type: '', notes: '', nextDate: '', status: '' });
      setSelectedCase(null);
      fetchOverdueCases();
    } catch (error) {
      console.error('Error adding follow-up:', error);
    }
  };

  const updateStatus = async (caseId, newStatus) => {
    try {
      await axios.put(`http://localhost:4000/api/overdue-cases/${caseId}/status`, { status: newStatus });
      fetchOverdueCases();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const filteredCases = overdueCases
    .filter(c => filterStatus === 'all' || c.status === filterStatus)
    .sort((a, b) => {
      if (sortBy === 'daysOverdue') return b.days_overdue - a.days_overdue;
      if (sortBy === 'amount') return b.overdue_amount - a.overdue_amount;
      if (sortBy === 'priority') {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return 0;
    });

  return (
    <div>
      <div className="page-header">
        <h2>Overdue Cases Tracking</h2>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>{overdueCases.length}</h3>
          <p>Total Cases</p>
        </div>
        <div className="stat-card">
          <h3>{overdueCases.filter(c => c.priority === 'critical').length}</h3>
          <p>Critical Cases</p>
        </div>
        <div className="stat-card">
          <h3>₹{overdueCases.reduce((sum, c) => sum + c.overdue_amount, 0).toLocaleString()}</h3>
          <p>Total Overdue</p>
        </div>
        <div className="stat-card">
          <h3>{Math.round(overdueCases.reduce((sum, c) => sum + c.days_overdue, 0) / overdueCases.length || 0)}</h3>
          <p>Avg Days Overdue</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ margin: 0, minWidth: '120px' }}>
            <label>Filter by Status:</label>
            <select className="form-control" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="contacted">Contacted</option>
              <option value="legal">Legal Action</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div className="form-group" style={{ margin: 0, minWidth: '120px' }}>
            <label>Sort by:</label>
            <select className="form-control" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="daysOverdue">Days Overdue</option>
              <option value="amount">Amount</option>
              <option value="priority">Priority</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={fetchOverdueCases} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Cases Table */}
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Loan ID</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Amount</th>
              <th>Days</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Last Payment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCases.map(caseItem => (
              <tr key={caseItem.id}>
                <td><strong>{caseItem.loan_id}</strong></td>
                <td>{caseItem.customer_name}</td>
                <td>{caseItem.phone}</td>
                <td>₹{caseItem.overdue_amount.toLocaleString()}</td>
                <td><span style={{ color: caseItem.days_overdue > 30 ? '#dc3545' : '#ffc107' }}>{caseItem.days_overdue}d</span></td>
                <td>
                  <span style={{ 
                    background: getPriorityColor(caseItem.priority), 
                    color: 'white', 
                    padding: '2px 6px', 
                    borderRadius: '3px', 
                    fontSize: '8px',
                    textTransform: 'uppercase'
                  }}>
                    {caseItem.priority}
                  </span>
                </td>
                <td>
                  <select 
                    className="form-control" 
                    value={caseItem.status} 
                    onChange={(e) => updateStatus(caseItem.id, e.target.value)}
                    style={{ fontSize: '9px', padding: '2px 4px' }}
                  >
                    <option value="pending">Pending</option>
                    <option value="contacted">Contacted</option>
                    <option value="legal">Legal Action</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </td>
                <td>{caseItem.last_payment}</td>
                <td>
                  <button 
                    className="btn btn-primary" 
                    style={{ fontSize: '8px', padding: '3px 6px' }}
                    onClick={() => setSelectedCase(caseItem)}
                  >
                    Follow Up
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Follow-up Modal */}
      {selectedCase && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '400px', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '14px' }}>Follow-up: {selectedCase.loan_id}</h3>
              <button 
                onClick={() => setSelectedCase(null)}
                style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
            
            <div className="form-group">
              <label>Follow-up Type:</label>
              <select 
                className="form-control" 
                value={followUpData.type} 
                onChange={(e) => setFollowUpData({...followUpData, type: e.target.value})}
              >
                <option value="">Select Type</option>
                <option value="call">Phone Call</option>
                <option value="sms">SMS</option>
                <option value="email">Email</option>
                <option value="visit">Field Visit</option>
                <option value="legal">Legal Notice</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Notes:</label>
              <textarea 
                className="form-control" 
                rows="3"
                value={followUpData.notes}
                onChange={(e) => setFollowUpData({...followUpData, notes: e.target.value})}
                placeholder="Enter follow-up notes..."
              />
            </div>
            
            <div className="form-group">
              <label>Next Follow-up Date:</label>
              <input 
                type="date" 
                className="form-control"
                value={followUpData.nextDate}
                onChange={(e) => setFollowUpData({...followUpData, nextDate: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label>Update Status:</label>
              <select 
                className="form-control" 
                value={followUpData.status} 
                onChange={(e) => setFollowUpData({...followUpData, status: e.target.value})}
              >
                <option value="">Keep Current</option>
                <option value="contacted">Contacted</option>
                <option value="promised">Payment Promised</option>
                <option value="legal">Legal Action</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setSelectedCase(null)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => addFollowUp(selectedCase.id)}
                disabled={!followUpData.type || !followUpData.notes}
              >
                Add Follow-up
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OverdueCases;