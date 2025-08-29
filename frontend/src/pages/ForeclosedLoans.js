import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../App.css';

export default function ForeclosedLoans() {
  const [foreclosedLoans, setForeclosedLoans] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:4000/foreclosed-loans').then((res) => setForeclosedLoans(res.data));
  }, []);

  return (
    <div className="main-content">
      <h2 style={{ color: '#1a237e', marginBottom: 24 }}>Foreclosed Loans</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Loan ID</th>
            <th>Customer Name</th>
            <th>Foreclosed Amount</th>
            <th>Foreclosure Date</th>
          </tr>
        </thead>
        <tbody>
          {foreclosedLoans.map((loan) => (
            <tr key={loan.loan_id}>
              <td>{loan.loan_id}</td>
              <td>{loan.customer_name}</td>
              <td>{loan.foreclosed_amount}</td>
              <td>{loan.foreclosure_date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
