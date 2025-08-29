import React, { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:4000/api' });
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function Open() {
  const [leads, setLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOpenLeads();
  }, []);

  const fetchOpenLeads = async () => {
    try {
      const response = await api.get('/leads?status=open');
      setLeads(response.data);
    } catch (error) {
      console.error('Error fetching open leads:', error);
    }
  };

  const updateLeadStatus = async (leadId, newStatus) => {
    try {
      await api.put(`/leads/${leadId}`, { status: newStatus });
      fetchOpenLeads();
      alert(`Lead moved to ${newStatus}`);
    } catch (error) {
      alert('Error updating lead status');
    }
  };

  const filteredLeads = leads.filter(lead => 
    lead.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone?.includes(searchTerm)
  );

  return (
    <div>
      <div className="page-header">
        <h2>Open Leads ({filteredLeads.length})</h2>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search leads by name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-control"
        />
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Loan Type</th>
              <th>Amount</th>
              <th>Source</th>
              <th>Priority</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.map(lead => (
              <tr key={lead.id}>
                <td>{lead.firstName} {lead.lastName}</td>
                <td>{lead.phone}</td>
                <td>{lead.loanType}</td>
                <td>₹{lead.loanAmount?.toLocaleString()}</td>
                <td>{lead.source}</td>
                <td>
                  <span className={`badge ${lead.priority === 'high' ? 'badge-danger' : 
                    lead.priority === 'medium' ? 'badge-warning' : 'badge-info'}`}>
                    {lead.priority}
                  </span>
                </td>
                <td>{new Date(lead.createdAt).toLocaleDateString()}</td>
                <td>
                  <button 
                    onClick={() => updateLeadStatus(lead.id, 'in-process')}
                    className="btn btn-sm btn-primary">
                    Start Process
                  </button>
                  <button 
                    onClick={() => updateLeadStatus(lead.id, 'converted')}
                    className="btn btn-sm btn-success">
                    Convert
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