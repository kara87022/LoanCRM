import React, { useState } from 'react';

export default function LegalCases() {
  const [legalCases, setLegalCases] = useState([
    { id: 1, loanId: 'L001', customer: 'John Doe', amount: 500000, daysOverdue: 120, status: 'Notice Sent', lawyer: 'Legal Firm A' },
    { id: 2, loanId: 'L002', customer: 'Jane Smith', amount: 750000, daysOverdue: 150, status: 'Court Filing', lawyer: 'Legal Firm B' },
    { id: 3, loanId: 'L003', customer: 'Mike Johnson', amount: 300000, daysOverdue: 90, status: 'Under Review', lawyer: 'Legal Firm C' }
  ]);

  const handleStatusUpdate = (id, newStatus) => {
    setLegalCases(prev => prev.map(c => 
      c.id === id ? { ...c, status: newStatus } : c
    ));
    alert(`Case ${id} status updated to ${newStatus}`);
  };

  return (
    <div>
      <div className="page-header">
        <h2>Legal Cases</h2>
      </div>
      <div className="card">
        <div className="card-header">
          <h3>Active Legal Cases</h3>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Case ID</th><th>Loan ID</th><th>Customer</th><th>Amount</th><th>Days Overdue</th><th>Status</th><th>Lawyer</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {legalCases.map(c => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.loanId}</td>
                <td>{c.customer}</td>
                <td>₹{c.amount.toLocaleString()}</td>
                <td><span className="badge badge-danger">{c.daysOverdue}</span></td>
                <td>
                  <span className={`status-badge status-${c.status.toLowerCase().replace(' ', '-')}`}>
                    {c.status}
                  </span>
                </td>
                <td>{c.lawyer}</td>
                <td>
                  <button onClick={() => handleStatusUpdate(c.id, 'Court Filing')} className="btn btn-sm btn-warning">File Case</button>
                  <button onClick={() => handleStatusUpdate(c.id, 'Settled')} className="btn btn-sm btn-success">Settle</button>
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