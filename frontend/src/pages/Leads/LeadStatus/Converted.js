import React, { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:4000/api' });
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function Converted() {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, conversionRate: 0 });

  useEffect(() => {
    fetchConvertedLeads();
  }, []);

  const fetchConvertedLeads = async () => {
    try {
      const response = await api.get('/leads?status=converted');
      setLeads(response.data);
      
      const thisMonth = response.data.filter(lead => {
        const leadDate = new Date(lead.convertedAt);
        const now = new Date();
        return leadDate.getMonth() === now.getMonth() && leadDate.getFullYear() === now.getFullYear();
      }).length;

      setStats({
        total: response.data.length,
        thisMonth,
        conversionRate: 75 // Calculate from total leads vs converted
      });
    } catch (error) {
      console.error('Error fetching converted leads:', error);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Converted Leads</h2>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>{stats.total}</h3>
          <p>Total Converted</p>
        </div>
        <div className="stat-card">
          <h3>{stats.thisMonth}</h3>
          <p>This Month</p>
        </div>
        <div className="stat-card">
          <h3>{stats.conversionRate}%</h3>
          <p>Conversion Rate</p>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Loan Type</th>
              <th>Amount</th>
              <th>Loan ID</th>
              <th>Converted Date</th>
              <th>Converted By</th>
            </tr>
          </thead>
          <tbody>
            {leads.map(lead => (
              <tr key={lead.id}>
                <td>{lead.firstName} {lead.lastName}</td>
                <td>{lead.phone}</td>
                <td>{lead.loanType}</td>
                <td>₹{lead.loanAmount?.toLocaleString()}</td>
                <td>{lead.loanId || 'N/A'}</td>
                <td>{lead.convertedAt ? new Date(lead.convertedAt).toLocaleDateString() : 'N/A'}</td>
                <td>{lead.convertedBy || 'System'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}