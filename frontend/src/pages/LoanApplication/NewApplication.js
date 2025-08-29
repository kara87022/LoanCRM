import React, { useState } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:4000/api' });
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function NewApplication() {
  const [formData, setFormData] = useState({
    applicant_name: '',
    phone: '',
    email: '',
    loan_type: 'Personal',
    amount: '',
    purpose: '',
    income: '',
    employment_type: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/applications', formData);
      alert('Application submitted successfully!');
      setFormData({
        applicant_name: '',
        phone: '',
        email: '',
        loan_type: 'Personal',
        amount: '',
        purpose: '',
        income: '',
        employment_type: ''
      });
    } catch (error) {
      alert('Error submitting application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>New Loan Application</h2>
      </div>
      <div className="card">
        <form onSubmit={handleSubmit} className="loan-form">
          <div className="form-row">
            <div className="form-group">
              <label>Applicant Name</label>
              <input
                type="text"
                value={formData.applicant_name}
                onChange={(e) => setFormData({...formData, applicant_name: e.target.value})}
                className="form-control"
                required
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="form-control"
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>Loan Type</label>
              <select
                value={formData.loan_type}
                onChange={(e) => setFormData({...formData, loan_type: e.target.value})}
                className="form-control"
              >
                <option value="Personal">Personal Loan</option>
                <option value="Business">Business Loan</option>
                <option value="Home">Home Loan</option>
                <option value="Vehicle">Vehicle Loan</option>
                <option value="Education">Education Loan</option>
                <option value="Gold">Gold Loan</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Loan Amount</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="form-control"
                required
              />
            </div>
            <div className="form-group">
              <label>Monthly Income</label>
              <input
                type="number"
                value={formData.income}
                onChange={(e) => setFormData({...formData, income: e.target.value})}
                className="form-control"
                required
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" disabled={loading} className="btn btn-success">
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
            <button type="button" className="btn btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}