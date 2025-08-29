import React, { useState } from 'react';

export default function ApprovedLoans() {
  const [approvedLoans, setApprovedLoans] = useState([
    { id: 1, applicant: 'John Doe', amount: 500000, approvedDate: '2024-01-15', status: 'Ready for Disbursement' },
    { id: 2, applicant: 'Jane Smith', amount: 750000, approvedDate: '2024-01-16', status: 'Disbursed' },
    { id: 3, applicant: 'Mike Johnson', amount: 300000, approvedDate: '2024-01-17', status: 'Documentation Pending' }
  ]);

  const handleDisburse = (id) => {
    setApprovedLoans(prev => prev.map(loan => 
      loan.id === id ? { ...loan, status: 'Disbursed' } : loan
    ));
    alert(`Loan ${id} has been disbursed successfully`);
  };

  return (
    <div>
      <div className="page-header">
        <h2>Approved Loans</h2>
      </div>
      <div className="card">
        <div className="card-header">
          <h3>Loans Ready for Disbursement</h3>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th><th>Applicant</th><th>Amount</th><th>Approved Date</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {approvedLoans.map(loan => (
              <tr key={loan.id}>
                <td>{loan.id}</td>
                <td>{loan.applicant}</td>
                <td>₹{loan.amount.toLocaleString()}</td>
                <td>{loan.approvedDate}</td>
                <td>
                  <span className={`status-badge ${loan.status === 'Disbursed' ? 'status-success' : loan.status === 'Ready for Disbursement' ? 'status-ready' : 'status-pending'}`}>
                    {loan.status}
                  </span>
                </td>
                <td>
                  {loan.status === 'Ready for Disbursement' && (
                    <button onClick={() => handleDisburse(loan.id)} className="btn btn-sm btn-success">Disburse</button>
                  )}
                  <button className="btn btn-sm btn-primary">View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}