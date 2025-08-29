import React, { useState } from 'react';

export default function ClientProfile() {
  const [client] = useState({
    name: 'John Doe',
    phone: '+91 9876543210',
    email: 'john.doe@email.com',
    address: '123 Main Street, City',
    occupation: 'Software Engineer',
    income: 75000,
    loans: [
      { id: 'L001', amount: 500000, status: 'Active', balance: 350000 },
      { id: 'L002', amount: 200000, status: 'Closed', balance: 0 }
    ]
  });

  return (
    <div>
      <div className="page-header">
        <h2>Client Profile</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="card">
          <h3>Personal Information</h3>
          <p><strong>Name:</strong> {client.name}</p>
          <p><strong>Phone:</strong> {client.phone}</p>
          <p><strong>Email:</strong> {client.email}</p>
          <p><strong>Address:</strong> {client.address}</p>
          <p><strong>Occupation:</strong> {client.occupation}</p>
          <p><strong>Monthly Income:</strong> ₹{client.income.toLocaleString()}</p>
        </div>

        <div className="card">
          <h3>Loan History</h3>
          <table className="table">
            <thead>
              <tr><th>Loan ID</th><th>Amount</th><th>Status</th><th>Balance</th></tr>
            </thead>
            <tbody>
              {client.loans.map(loan => (
                <tr key={loan.id}>
                  <td>{loan.id}</td>
                  <td>₹{loan.amount.toLocaleString()}</td>
                  <td>{loan.status}</td>
                  <td>₹{loan.balance.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3>Actions</h3>
        <button className="btn btn-primary" style={{margin: '0.25rem'}}>Edit Profile</button>
        <button className="btn btn-primary" style={{margin: '0.25rem'}}>View Documents</button>
        <button className="btn btn-primary" style={{margin: '0.25rem'}}>Payment History</button>
        <button className="btn btn-primary" style={{margin: '0.25rem'}}>Send Message</button>
      </div>
    </div>
  );
}