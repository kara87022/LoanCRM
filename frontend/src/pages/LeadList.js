import React, { useState } from 'react';

export default function LeadList() {
  const [leads, setLeads] = useState([
    { id: 1, name: 'John Doe', phone: '9876543210', loanType: 'Personal', amount: 500000, source: 'Website', status: 'Open' },
    { id: 2, name: 'Jane Smith', phone: '9876543211', loanType: 'Business', amount: 1000000, source: 'Referral', status: 'In Progress' },
    { id: 3, name: 'Mike Johnson', phone: '9876543212', loanType: 'Home', amount: 2500000, source: 'Advertisement', status: 'Converted' }
  ]);

  const handleStatusChange = (id, newStatus) => {
    setLeads(prev => prev.map(lead => 
      lead.id === id ? { ...lead, status: newStatus } : lead
    ));
    alert(`Lead ${id} status updated to ${newStatus}`);
  };

  return (
    <div>
      <div className="page-header">
        <h2>Lead List</h2>
        <button className="btn btn-primary">Add New Lead</button>
      </div>
      <div className="card">
        <div className="card-header">
          <h3>All Leads ({leads.length})</h3>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th><th>Name</th><th>Phone</th><th>Loan Type</th><th>Amount</th><th>Source</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map(lead => (
              <tr key={lead.id}>
                <td>{lead.id}</td>
                <td>{lead.name}</td>
                <td>{lead.phone}</td>
                <td>{lead.loanType}</td>
                <td>₹{lead.amount.toLocaleString()}</td>
                <td>{lead.source}</td>
                <td>
                  <span className={`status-badge status-${lead.status.toLowerCase().replace(' ', '-')}`}>
                    {lead.status}
                  </span>
                </td>
                <td>
                  <button onClick={() => handleStatusChange(lead.id, 'In Progress')} className="btn btn-sm btn-warning">Follow Up</button>
                  <button onClick={() => handleStatusChange(lead.id, 'Converted')} className="btn btn-sm btn-success">Convert</button>
                  <button className="btn btn-sm btn-primary">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}