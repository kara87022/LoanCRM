import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../App.css';

export default function Report() {
  const [report, setReport] = useState([]);
  useEffect(() => {
    axios.get('http://localhost:4000/report').then(res => setReport(res.data));
  }, []);
  return (
    <div className="main-content">
      <h2 style={{ color: '#1a237e', marginBottom: 24 }}>Report</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Loan ID</th><th>Borrower</th><th>Amount</th><th>Balance</th><th>Collections Count</th>
          </tr>
        </thead>
        <tbody>
          {report.map(r => (
            <tr key={r.id}>
              <td>{r.id}</td><td>{r.borrower}</td><td>{r.amount}</td><td>{r.balance}</td><td>{r.collections_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
