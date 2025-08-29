import React, { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:4000/api' });
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function InProcess() {
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    fetchInProcessLeads();
  }, []);

  const fetchInProcessLeads = async () => {
    try {
      const response = await api.get('/leads?status=in-process');
      setLeads(response.data);
    } catch (error) {
      console.error('Error fetching in-process leads:', error);
    }
  };

  const updateLeadStatus = async (leadId, newStatus) => {
    try {
      await api.put(`/leads/${leadId}`, { status: newStatus });
      fetchInProcessLeads();
      alert(`Lead ${newStatus}`);
    } catch (error) {
      alert('Error updating lead status');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>In Process Leads ({leads.length})</h2>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Loan Type</th>
              <th>Amount</th>
              <th>Assigned To</th>
              <th>Progress</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map(lead => (
              <tr key={lead.id}>
                <td>{lead.firstName} {lead.lastName}</td>
                <td>{lead.phone}</td>
                <td>{lead.loanType}</td>
                <td>₹{lead.loanAmount?.toLocaleString()}</td>
                <td>{lead.assignedTo || 'Unassigned'}</td>
                <td>
                  <div className="progress">
                    <div className="progress-bar" style={{width: '60%'}}>60%</div>
                  </div>
                </td>
                <td>
                  <button 
                    onClick={() => updateLeadStatus(lead.id, 'converted')}
                    className="btn btn-sm btn-success">
                    Convert
                  </button>
                  <button 
                    onClick={() => updateLeadStatus(lead.id, 'rejected')}
                    className="btn btn-sm btn-danger">
                    Reject
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