import React, { useState } from 'react';

export default function EmployeeDashboard() {
  const [stats] = useState({
    assignedLoans: 25,
    pendingApprovals: 8,
    collectionsToday: 150000,
    leadsAssigned: 12
  });

  return (
    <div>
      <div className="page-header">
        <h2>Employee Dashboard</h2>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>{stats.assignedLoans}</h3>
          <p>Assigned Loans</p>
        </div>
        <div className="stat-card">
          <h3>{stats.pendingApprovals}</h3>
          <p>Pending Approvals</p>
        </div>
        <div className="stat-card">
          <h3>₹{stats.collectionsToday.toLocaleString()}</h3>
          <p>Collections Today</p>
        </div>
        <div className="stat-card">
          <h3>{stats.leadsAssigned}</h3>
          <p>Leads Assigned</p>
        </div>
      </div>

      <div className="card">
        <h3>Today's Tasks</h3>
        <ul>
          <li>Follow up with 5 pending loan applications</li>
          <li>Process 3 loan disbursements</li>
          <li>Contact overdue customers (8 cases)</li>
          <li>Update lead status for 6 prospects</li>
        </ul>
      </div>
    </div>
  );
}