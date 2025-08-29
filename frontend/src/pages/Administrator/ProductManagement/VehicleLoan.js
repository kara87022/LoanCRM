import React, { useState } from 'react';

export default function VehicleLoan() {
  const [vehicleType, setVehicleType] = useState('car');
  
  const loanConfig = {
    car: { rate: '9.5%', amount: '₹50,000 - ₹50,00,000', tenure: '12-84 months' },
    bike: { rate: '12%', amount: '₹25,000 - ₹5,00,000', tenure: '12-48 months' },
    commercial: { rate: '11%', amount: '₹1,00,000 - ₹1,00,00,000', tenure: '12-96 months' }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Vehicle Loan Configuration</h2>
      </div>

      <div className="card">
        <div className="form-group">
          <label>Vehicle Type</label>
          <select className="form-control" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
            <option value="car">Car Loan</option>
            <option value="bike">Two Wheeler Loan</option>
            <option value="commercial">Commercial Vehicle Loan</option>
          </select>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>{loanConfig[vehicleType].rate}</h3>
            <p>Interest Rate</p>
          </div>
          <div className="stat-card">
            <h3>{loanConfig[vehicleType].amount}</h3>
            <p>Loan Amount</p>
          </div>
          <div className="stat-card">
            <h3>{loanConfig[vehicleType].tenure}</h3>
            <p>Tenure</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Vehicle Loan Benefits</h3>
        <ul>
          <li>Up to 90% financing of vehicle cost</li>
          <li>Competitive interest rates</li>
          <li>Flexible repayment options</li>
          <li>Quick processing and approval</li>
          <li>Minimal documentation</li>
        </ul>
      </div>
    </div>
  );
}