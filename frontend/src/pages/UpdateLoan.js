import React, { useState } from 'react';
import axios from 'axios';
import '../App.css';

export default function UpdateLoan() {
  const [loanId, setLoanId] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [status, setStatus] = useState('');

  const handleUpdate = () => {
    axios.put(`http://localhost:4000/loans/${loanId}`, { loan_amount: loanAmount, status })
      .then(() => alert('Loan updated successfully'))
      .catch((error) => console.error('Error updating loan:', error));
  };

  return (
    <div className="main-content">
      <h2 style={{ color: '#1a237e', marginBottom: 24 }}>Update Loan</h2>
      <div className="form-group">
        <label>Loan ID</label>
        <input
          type="text"
          value={loanId}
          onChange={(e) => setLoanId(e.target.value)}
          placeholder="Enter Loan ID"
        />
      </div>
      <div className="form-group">
        <label>Loan Amount</label>
        <input
          type="number"
          value={loanAmount}
          onChange={(e) => setLoanAmount(e.target.value)}
          placeholder="Enter Loan Amount"
        />
      </div>
      <div className="form-group">
        <label>Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Select Status</option>
          <option value="Active">Active</option>
          <option value="Closed">Closed</option>
          <option value="Foreclosed">Foreclosed</option>
        </select>
      </div>
      <button className="btn" onClick={handleUpdate}>Update Loan</button>
    </div>
  );
}
