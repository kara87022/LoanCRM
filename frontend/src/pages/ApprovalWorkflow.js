import React, { useState } from 'react';

export default function ApprovalWorkflow() {
  const [applications, setApplications] = useState([
    { id: 1, applicant: 'John Doe', amount: 500000, status: 'Pending L1', level: 1, risk: 'Low' },
    { id: 2, applicant: 'Jane Smith', amount: 1000000, status: 'Pending L2', level: 2, risk: 'Medium' },
    { id: 3, applicant: 'Mike Johnson', amount: 250000, status: 'Approved', level: 3, risk: 'Low' }
  ]);

  const handleApproval = (id, action) => {
    setApplications(prev => prev.map(app => 
      app.id === id 
        ? { ...app, status: action === 'approve' ? 'Approved' : 'Rejected' }
        : app
    ));
    alert(`Application ${id} ${action}d successfully`);
  };

  return (
    <div>
      <div className="page-header">
        <h2>Approval Workflow</h2>
      </div>
      <div className="card">
        <div className="card-header">
          <h3>Pending Approvals</h3>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th><th>Applicant</th><th>Amount</th><th>Risk</th><th>Status</th><th>Level</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map(app => (
              <tr key={app.id}>
                <td>{app.id}</td>
                <td>{app.applicant}</td>
                <td>₹{app.amount.toLocaleString()}</td>
                <td>
                  <span className={`badge ${app.risk === 'Low' ? 'badge-success' : app.risk === 'Medium' ? 'badge-warning' : 'badge-danger'}`}>
                    {app.risk}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${app.status.includes('Pending') ? 'status-pending' : app.status === 'Approved' ? 'status-approved' : 'status-rejected'}`}>
                    {app.status}
                  </span>
                </td>
                <td>L{app.level}</td>
                <td>
                  {app.status.includes('Pending') && (
                    <>
                      <button onClick={() => handleApproval(app.id, 'approve')} className="btn btn-sm btn-success">Approve</button>
                      <button onClick={() => handleApproval(app.id, 'reject')} className="btn btn-sm btn-danger">Reject</button>
                    </>
                  )}
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