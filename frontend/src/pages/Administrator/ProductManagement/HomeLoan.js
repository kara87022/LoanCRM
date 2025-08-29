import React, { useState } from 'react';

export default function HomeLoan() {
  const [config, setConfig] = useState({
    minAmount: '500000',
    maxAmount: '10000000',
    interestRate: '8.5',
    tenure: '240',
    processingFee: '0.5'
  });

  return (
    <div>
      <div className="page-header">
        <h2>Home Loan Configuration</h2>
      </div>

      <div className="card">
        <div className="form-row">
          <div className="form-group">
            <label>Min Amount</label>
            <input type="number" className="form-control" value={config.minAmount}
              onChange={(e) => setConfig({...config, minAmount: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Max Amount</label>
            <input type="number" className="form-control" value={config.maxAmount}
              onChange={(e) => setConfig({...config, maxAmount: e.target.value})} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Interest Rate (%)</label>
            <input type="number" step="0.1" className="form-control" value={config.interestRate}
              onChange={(e) => setConfig({...config, interestRate: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Max Tenure (months)</label>
            <input type="number" className="form-control" value={config.tenure}
              onChange={(e) => setConfig({...config, tenure: e.target.value})} />
          </div>
        </div>
        <button className="btn btn-success">Save Configuration</button>
      </div>

      <div className="card">
        <h3>Home Loan Features</h3>
        <ul>
          <li>Competitive interest rates starting from 8.5%</li>
          <li>Loan amount up to ₹1 Crore</li>
          <li>Flexible repayment tenure up to 20 years</li>
          <li>Minimal processing fee</li>
          <li>Quick approval process</li>
        </ul>
      </div>
    </div>
  );
}