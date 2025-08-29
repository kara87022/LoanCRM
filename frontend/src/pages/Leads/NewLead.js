import React, { useState } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:4000/api' });
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function NewLead() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    loanType: '',
    loanAmount: '',
    source: '',
    notes: '',
    priority: 'medium'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/leads', formData);
      alert('Lead created successfully!');
      setFormData({
        firstName: '', lastName: '', phone: '', email: '', loanType: '',
        loanAmount: '', source: '', notes: '', priority: 'medium'
      });
    } catch (error) {
      alert('Error creating lead');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Create New Lead</h2>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input type="text" className="form-control" value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input type="text" className="form-control" value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input type="tel" className="form-control" value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" className="form-control" value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Loan Type</label>
              <select className="form-control" value={formData.loanType}
                onChange={(e) => setFormData({...formData, loanType: e.target.value})} required>
                <option value="">Select Loan Type</option>
                <option value="personal">Personal Loan</option>
                <option value="business">Business Loan</option>
                <option value="home">Home Loan</option>
                <option value="vehicle">Vehicle Loan</option>
                <option value="education">Education Loan</option>
                <option value="gold">Gold Loan</option>
              </select>
            </div>
            <div className="form-group">
              <label>Loan Amount</label>
              <input type="number" className="form-control" value={formData.loanAmount}
                onChange={(e) => setFormData({...formData, loanAmount: e.target.value})} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Lead Source</label>
              <select className="form-control" value={formData.source}
                onChange={(e) => setFormData({...formData, source: e.target.value})}>
                <option value="">Select Source</option>
                <option value="website">Website</option>
                <option value="referral">Referral</option>
                <option value="social-media">Social Media</option>
                <option value="advertisement">Advertisement</option>
                <option value="walk-in">Walk-in</option>
                <option value="phone">Phone Call</option>
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select className="form-control" value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea className="form-control" rows="3" value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Additional notes about the lead..."></textarea>
          </div>

          <button type="submit" className="btn btn-success">Create Lead</button>
        </form>
      </div>
    </div>
  );
}