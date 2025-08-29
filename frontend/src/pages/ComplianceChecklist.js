import React, { useState } from 'react';

export default function ComplianceChecklist() {
  const [compliance, setCompliance] = useState([
    { id: 1, item: 'RBI Guidelines Compliance', status: 'Completed', priority: 'High' },
    { id: 2, item: 'KYC Norms Verification', status: 'Pending', priority: 'High' },
    { id: 3, item: 'Anti-Money Laundering Check', status: 'Completed', priority: 'Medium' },
    { id: 4, item: 'Credit Information Report', status: 'Pending', priority: 'Medium' },
    { id: 5, item: 'Legal Documentation', status: 'In Progress', priority: 'High' }
  ]);

  const updateStatus = (id, newStatus) => {
    setCompliance(prev => prev.map(item => 
      item.id === id ? { ...item, status: newStatus } : item
    ));
  };

  return (
    <div>
      <div className="page-header">
        <h2>Compliance Checklist</h2>
      </div>
      <div className="card">
        <div className="card-header">
          <h3>Regulatory Compliance Items</h3>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Compliance Item</th><th>Priority</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {compliance.map(item => (
              <tr key={item.id}>
                <td>{item.item}</td>
                <td>
                  <span className={`badge ${item.priority === 'High' ? 'badge-danger' : 'badge-warning'}`}>
                    {item.priority}
                  </span>
                </td>
                <td>
                  <span className={`status-badge status-${item.status.toLowerCase().replace(' ', '-')}`}>
                    {item.status}
                  </span>
                </td>
                <td>
                  <button onClick={() => updateStatus(item.id, 'Completed')} className="btn btn-sm btn-success">Complete</button>
                  <button onClick={() => updateStatus(item.id, 'In Progress')} className="btn btn-sm btn-warning">Start</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}