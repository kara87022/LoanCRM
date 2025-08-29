import React, { useState } from 'react';

export default function GoldLoan() {
  const [goldRate, setGoldRate] = useState('5500');
  const [ltvRatio, setLtvRatio] = useState('75');

  return (
    <div>
      <div className="page-header">
        <h2>Gold Loan Configuration</h2>
      </div>

      <div className="card">
        <div className="form-row">
          <div className="form-group">
            <label>Current Gold Rate (per gram)</label>
            <input type="number" className="form-control" value={goldRate}
              onChange={(e) => setGoldRate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>LTV Ratio (%)</label>
            <input type="number" className="form-control" value={ltvRatio}
              onChange={(e) => setLtvRatio(e.target.value)} />
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>₹{goldRate}</h3>
            <p>Gold Rate/gram</p>
          </div>
          <div className="stat-card">
            <h3>{ltvRatio}%</h3>
            <p>LTV Ratio</p>
          </div>
          <div className="stat-card">
            <h3>12%</h3>
            <p>Interest Rate</p>
          </div>
          <div className="stat-card">
            <h3>36 months</h3>
            <p>Max Tenure</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Gold Loan Calculator</h3>
        <div className="form-group">
          <label>Gold Weight (grams)</label>
          <input type="number" className="form-control" placeholder="Enter gold weight" />
        </div>
        <div className="form-group">
          <label>Estimated Loan Amount</label>
          <input type="text" className="form-control" value="₹0" readOnly />
        </div>
        <button className="btn btn-primary">Calculate</button>
      </div>

      <div className="card">
        <h3>Gold Loan Features</h3>
        <ul>
          <li>Instant loan approval</li>
          <li>Minimal documentation</li>
          <li>Competitive interest rates</li>
          <li>Flexible repayment options</li>
          <li>Safe and secure gold storage</li>
        </ul>
      </div>
    </div>
  );
}