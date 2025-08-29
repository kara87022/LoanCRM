import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../App.css';

export default function Collections() {
  const [collections, setCollections] = useState([]);
  useEffect(() => {
    axios.get('http://localhost:4000/collections').then(res => setCollections(res.data));
  }, []);
  return (
    <div className="main-content">
      <h2 style={{ color: '#1a237e', marginBottom: 24 }}>Collections</h2>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th><th>Loan ID</th><th>Date</th><th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {collections.map(c => (
            <tr key={c.id}>
              <td>{c.id}</td><td>{c.loan_id}</td><td>{c.date}</td><td>{c.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
