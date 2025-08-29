import React, { useState } from 'react';

export default function CustomerDashboard() {
  const [customerData] = useState({
    name: 'John Doe',
    loanAmount: 500000,
    balance: 350000,
    nextPayment: 25000,
    dueDate: '2024-02-15'
  });

  return (
    <div>
      <div className="page-header">
        <h2>Welcome, {customerData.name}</h2>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>₹{customerData.loanAmount.toLocaleString()}</h3>
          <p>Loan Amount</p>
        </div>
        <div className="stat-card">
          <h3>₹{customerData.balance.toLocaleString()}</h3>
          <p>Outstanding Balance</p>
        </div>
        <div className="stat-card">
          <h3>₹{customerData.nextPayment.toLocaleString()}</h3>
          <p>Next Payment</p>
        </div>
        <div className="stat-card">
          <h3>{customerData.dueDate}</h3>
          <p>Due Date</p>
        </div>
      </div>

      <div className="card">
        <h3>Quick Actions</h3>
        <button className="btn btn-primary" style={{margin: '0.25rem'}}>Make Payment</button>
        <button className="btn btn-primary" style={{margin: '0.25rem'}}>View Statement</button>
        <button className="btn btn-primary" style={{margin: '0.25rem'}}>Download Receipt</button>
        <button className="btn btn-primary" style={{margin: '0.25rem'}}>Contact Support</button>
      </div>
    </div>
  );
}