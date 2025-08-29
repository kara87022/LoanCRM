import React, { useState } from 'react';

export default function DocumentVerification() {
  const [applications, setApplications] = useState([
    { id: 1, applicant: 'John Doe', documents: 6, verified: 4, pending: 2 },
    { id: 2, applicant: 'Jane Smith', documents: 6, verified: 6, pending: 0 },
    { id: 3, applicant: 'Mike Johnson', documents: 5, verified: 3, pending: 2 }
  ]);

  const handleVerify = (id, action) => {
    alert(`${action} application ${id}`);
  };

  return (
    <div>
      <div className="page-header">
        <h2>Document Verification</h2>
      </div>
      <div className="card">
        <div className="card-header">
          <h3>Pending Verifications</h3>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Application ID</th><th>Applicant</th><th>Total Docs</th><th>Verified</th><th>Pending</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map(app => (
              <tr key={app.id}>
                <td>{app.id}</td>
                <td>{app.applicant}</td>
                <td>{app.documents}</td>
                <td><span className="badge badge-success">{app.verified}</span></td>
                <td><span className="badge badge-warning">{app.pending}</span></td>
                <td>
                  <button onClick={() => handleVerify(app.id, 'View')} className="btn btn-sm btn-primary">View</button>
                  <button onClick={() => handleVerify(app.id, 'Approve')} className="btn btn-sm btn-success">Approve</button>
                  <button onClick={() => handleVerify(app.id, 'Reject')} className="btn btn-sm btn-danger">Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}