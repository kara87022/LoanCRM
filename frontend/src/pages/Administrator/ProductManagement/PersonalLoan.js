import React, { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:4000/api' });
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function PersonalLoan() {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Personal Loan',
    minAmount: '10000',
    maxAmount: '500000',
    interestRate: '12',
    tenure: '24',
    processingFee: '2',
    eligibility: 'Minimum salary ₹25,000, Age 21-60'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/products', { ...formData, type: 'personal' });
      alert('Personal Loan product configured successfully!');
      setShowForm(false);
    } catch (error) {
      alert('Error configuring product');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Personal Loan Configuration</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          Configure Product
        </button>
      </div>

      {showForm && (
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Min Amount</label>
                <input type="number" className="form-control" value={formData.minAmount}
                  onChange={(e) => setFormData({...formData, minAmount: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Max Amount</label>
                <input type="number" className="form-control" value={formData.maxAmount}
                  onChange={(e) => setFormData({...formData, maxAmount: e.target.value})} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Interest Rate (%)</label>
                <input type="number" step="0.1" className="form-control" value={formData.interestRate}
                  onChange={(e) => setFormData({...formData, interestRate: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Max Tenure (months)</label>
                <input type="number" className="form-control" value={formData.tenure}
                  onChange={(e) => setFormData({...formData, tenure: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label>Processing Fee (%)</label>
              <input type="number" step="0.1" className="form-control" value={formData.processingFee}
                onChange={(e) => setFormData({...formData, processingFee: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Eligibility Criteria</label>
              <textarea className="form-control" value={formData.eligibility}
                onChange={(e) => setFormData({...formData, eligibility: e.target.value})} />
            </div>
            <button type="submit" className="btn btn-success">Save Configuration</button>
          </form>
        </div>
      )}

      <div className="card">
        <h3>Current Personal Loan Configuration</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <h3>₹10,000 - ₹5,00,000</h3>
            <p>Loan Amount Range</p>
          </div>
          <div className="stat-card">
            <h3>12% - 18%</h3>
            <p>Interest Rate</p>
          </div>
          <div className="stat-card">
            <h3>12 - 60 months</h3>
            <p>Tenure Options</p>
          </div>
          <div className="stat-card">
            <h3>2%</h3>
            <p>Processing Fee</p>
          </div>
        </div>
      </div>
    </div>
  );
}