import React, { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:4000/api' });
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function ApplicationList() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await api.get('/applications');
      setApplications(response.data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading applications...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Loan Applications</h2>
        <button onClick={fetchApplications} className="btn btn-primary">Refresh</button>
      </div>
      <div className="card">
        <div className="card-header">
          <h3>All Applications ({applications.length})</h3>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th><th>Applicant</th><th>Loan Type</th><th>Amount</th><th>Status</th><th>Date</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app, index) => (
              <tr key={index}>
                <td>{app.id || 'N/A'}</td>
                <td>{app.applicant_name || 'N/A'}</td>
                <td>{app.loan_type || 'N/A'}</td>
                <td>₹{(app.amount || 0).toLocaleString()}</td>
                <td><span className={`status-badge status-${app.status}`}>{app.status || 'Pending'}</span></td>
                <td>{app.created_at || 'N/A'}</td>
                <td>
                  <button className="btn btn-sm btn-primary">View</button>
                  <button className="btn btn-sm btn-success">Approve</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}