import React, { useEffect, useState } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000/api'
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default function MarkDefault() {
  const [defaultCandidates, setDefaultCandidates] = useState([]);
  const [defaultCustomers, setDefaultCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDefaultCandidates();
    fetchDefaultCustomers();
  }, []);

  const fetchDefaultCandidates = async () => {
    try {
      const response = await api.get('/installments/overdue?days=30');
      setDefaultCandidates(response.data || []);
    } catch (error) {
      console.error('Error fetching default candidates:', error);
      setDefaultCandidates([]);
    }
  };

  const fetchDefaultCustomers = async () => {
    try {
      const response = await api.get('/loans?status=Default');
      setDefaultCustomers(response.data || []);
    } catch (error) {
      console.error('Error fetching default customers:', error);
      setDefaultCustomers([]);
    }
  };

  const markAsDefault = async (loanId, reason) => {
    setLoading(true);
    try {
      await api.put(`/loans/${loanId}`, {
        status: 'Default',
        default_reason: reason,
        default_date: new Date().toISOString().split('T')[0]
      });
      
      alert('Customer marked as default successfully!');
      fetchDefaultCandidates();
      fetchDefaultCustomers();
    } catch (error) {
      console.error('Error marking default:', error);
      alert('Error marking default. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const removeFromDefault = async (loanId) => {
    if (!confirm('Are you sure you want to remove this customer from default list?')) return;
    
    setLoading(true);
    try {
      await api.put(`/loans/${loanId}`, {
        status: 'Active',
        default_reason: null,
        default_date: null
      });
      
      alert('Customer removed from default list!');
      fetchDefaultCustomers();
      fetchDefaultCandidates();
    } catch (error) {
      console.error('Error removing from default:', error);
      alert('Error removing from default. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDefault = (candidate) => {
    const reason = prompt('Enter reason for marking as default:');
    if (!reason) return;
    
    markAsDefault(candidate.loan_id, reason);
  };

  const filteredCandidates = defaultCandidates.filter(candidate =>
    candidate.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.loan_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDefaults = defaultCustomers.filter(customer =>
    customer.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.loan_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div>
      <div className="page-header">
        <h2>Mark Default Customers</h2>
        <div className="header-actions">
          <button onClick={() => { fetchDefaultCandidates(); fetchDefaultCustomers(); }} className="btn btn-primary">
            Refresh
          </button>
        </div>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by customer name or loan ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-control"
        />
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Default Candidates ({filteredCandidates.length})</h3>
          <small>Customers with 30+ days overdue</small>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Loan ID</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Total Overdue</th>
              <th>Days Overdue</th>
              <th>Last Payment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCandidates.map((candidate, index) => (
              <tr key={index}>
                <td>{candidate.loan_id}</td>
                <td>{candidate.customer_name}</td>
                <td>{candidate.phone || 'N/A'}</td>
                <td>{formatCurrency(candidate.overdue_amount)}</td>
                <td>
                  <span className={`status-badge ${candidate.days_overdue > 60 ? 'status-critical' : 'status-overdue'}`}>
                    {candidate.days_overdue}
                  </span>
                </td>
                <td>{candidate.last_payment || 'N/A'}</td>
                <td>
                  <button
                    onClick={() => handleMarkDefault(candidate)}
                    className="btn btn-sm btn-danger"
                    disabled={loading}
                  >
                    Mark Default
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Default Customers ({filteredDefaults.length})</h3>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Loan ID</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Default Amount</th>
              <th>Marked Date</th>
              <th>Reason</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDefaults.map((customer, index) => (
              <tr key={index}>
                <td>{customer.loan_id}</td>
                <td>{customer.customer_name}</td>
                <td>{customer.phone || 'N/A'}</td>
                <td>{formatCurrency(customer.default_amount)}</td>
                <td>{customer.marked_date}</td>
                <td>{customer.reason}</td>
                <td>
                  <button
                    onClick={() => removeFromDefault(customer.loan_id)}
                    className="btn btn-sm btn-warning"
                    disabled={loading}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}