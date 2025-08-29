import React, { useState } from 'react';

export default function ManagerDashboard() {
  const [stats] = useState({
    teamSize: 15,
    monthlyTarget: 5000000,
    achieved: 3500000,
    approvalsPending: 25
  });

  return (
    <div>
      <div className="page-header">
        <h2>Manager Dashboard</h2>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>{stats.teamSize}</h3>
          <p>Team Size</p>
        </div>
        <div className="stat-card">
          <h3>₹{stats.monthlyTarget.toLocaleString()}</h3>
          <p>Monthly Target</p>
        </div>
        <div className="stat-card">
          <h3>₹{stats.achieved.toLocaleString()}</h3>
          <p>Achieved</p>
        </div>
        <div className="stat-card">
          <h3>{Math.round((stats.achieved/stats.monthlyTarget)*100)}%</h3>
          <p>Target Achievement</p>
        </div>
      </div>

      <div className="card">
        <h3>Team Performance</h3>
        <div className="progress" style={{marginBottom: '1rem'}}>
          <div className="progress-bar" style={{width: `${(stats.achieved/stats.monthlyTarget)*100}%`}}>
            {Math.round((stats.achieved/stats.monthlyTarget)*100)}%
          </div>
        </div>
        <p>Monthly target progress</p>
      </div>

      <div className="card">
        <h3>Pending Approvals</h3>
        <p>{stats.approvalsPending} loan applications require your approval</p>
        <button className="btn btn-primary">Review Applications</button>
      </div>
    </div>
  );
}