import React, { useState } from 'react';

export default function EducationLoan() {
  const [courseType, setCourseType] = useState('domestic');

  return (
    <div>
      <div className="page-header">
        <h2>Education Loan Configuration</h2>
      </div>

      <div className="card">
        <div className="form-group">
          <label>Course Type</label>
          <select className="form-control" value={courseType} onChange={(e) => setCourseType(e.target.value)}>
            <option value="domestic">Domestic Education</option>
            <option value="international">International Education</option>
          </select>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>{courseType === 'domestic' ? '9.5%' : '11%'}</h3>
            <p>Interest Rate</p>
          </div>
          <div className="stat-card">
            <h3>{courseType === 'domestic' ? '₹10L' : '₹50L'}</h3>
            <p>Max Amount</p>
          </div>
          <div className="stat-card">
            <h3>15 years</h3>
            <p>Max Tenure</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Education Loan Features</h3>
        <ul>
          <li>No collateral required up to ₹7.5 lakhs</li>
          <li>Moratorium period during course duration</li>
          <li>Tax benefits under Section 80E</li>
          <li>Covers tuition fees, hostel fees, and other expenses</li>
          <li>Simple interest during moratorium period</li>
        </ul>
      </div>
    </div>
  );
}