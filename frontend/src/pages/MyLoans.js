import React, { useState } from 'react';

export default function MyLoans() {
  const [customerLoans] = useState([
    { id: 'L001', amount: 500000, emi: 35714, nextDue: '2024-02-15', status: 'Active', balance: 450000 },
    { id: 'L002', amount: 300000, emi: 21428, nextDue: '2024-02-20', status: 'Active', balance: 250000 }
  ]);

  return (
    <div>
      <div className="page-header">
        <h2>My Loans</h2>
      </div>
      <div className="card">
        <div className="card-header">
          <h3>Active Loans</h3>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Loan ID</th><th>Loan Amount</th><th>EMI Amount</th><th>Next Due Date</th><th>Outstanding</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customerLoans.map(loan => (
              <tr key={loan.id}>
                <td>{loan.id}</td>
                <td>₹{loan.amount.toLocaleString()}</td>
                <td>₹{loan.emi.toLocaleString()}</td>
                <td>{loan.nextDue}</td>
                <td>₹{loan.balance.toLocaleString()}</td>
                <td><span className="status-badge status-active">{loan.status}</span></td>
                <td>
                  <button className="btn btn-sm btn-success">Pay EMI</button>
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