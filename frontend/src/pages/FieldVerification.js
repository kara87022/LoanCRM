import React, { useState } from 'react';

export default function FieldVerification() {
  const [verifications, setVerifications] = useState([
    { id: 1, applicant: 'John Doe', address: '123 Main St', officer: 'Officer A', status: 'Pending' },
    { id: 2, applicant: 'Jane Smith', address: '456 Oak Ave', officer: 'Officer B', status: 'Completed' },
    { id: 3, applicant: 'Mike Johnson', address: '789 Pine Rd', officer: 'Officer C', status: 'In Progress' }
  ]);

  const handleStatusUpdate = (id, newStatus) => {
    setVerifications(prev => prev.map(v => 
      v.id === id ? { ...v, status: newStatus } : v
    ));
    alert(`Verification ${id} status updated to ${newStatus}`);
  };

  return (
    <div>
      <div className="page-header">
        <h2>Field Verification</h2>
      </div>
      <div className="card">
        <div className="card-header">
          <h3>Field Verification Queue</h3>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th><th>Applicant</th><th>Address</th><th>Officer</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {verifications.map(v => (
              <tr key={v.id}>
                <td>{v.id}</td>
                <td>{v.applicant}</td>
                <td>{v.address}</td>
                <td>{v.officer}</td>
                <td>
                  <span className={`status-badge status-${v.status.toLowerCase().replace(' ', '-')}`}>
                    {v.status}
                  </span>
                </td>
                <td>
                  <button onClick={() => handleStatusUpdate(v.id, 'In Progress')} className="btn btn-sm btn-warning">Start</button>
                  <button onClick={() => handleStatusUpdate(v.id, 'Completed')} className="btn btn-sm btn-success">Complete</button>
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