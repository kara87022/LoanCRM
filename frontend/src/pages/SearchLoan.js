import React, { useState } from 'react';
import axios from 'axios';
import '../App.css';

export default function SearchLoan() {
  const [searchTerm, setSearchTerm] = useState('');
  const [loan, setLoan] = useState(null);

  const handleSearch = () => {
    axios.get(`http://localhost:4000/loans/${searchTerm}`)
      .then((res) => setLoan(res.data))
      .catch((error) => console.error('Error fetching loan:', error));
  };

  return (
    <div className="main-content">
      <h2 style={{ color: '#1a237e', marginBottom: 24 }}>Search Loan</h2>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Enter Loan ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="btn" onClick={handleSearch}>Search</button>
      </div>
      {loan && (
        <div className="card">
          <h3>Loan Details</h3>
          <p><strong>Loan ID:</strong> {loan.loan_id}</p>
          <p><strong>Customer Name:</strong> {loan.customer_name}</p>
          <p><strong>Loan Amount:</strong> {loan.loan_amount}</p>
          <p><strong>Branch:</strong> {loan.branch}</p>
        </div>
      )}
    </div>
  );
}
