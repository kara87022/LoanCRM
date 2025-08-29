import React, { useState } from 'react';

export default function Reports() {
  const [reportType, setReportType] = useState('loan-summary');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const reports = {
    'loan-summary': 'Loan Portfolio Summary',
    'collection-report': 'Collection Performance',
    'branch-performance': 'Branch Performance',
    'lead-conversion': 'Lead Conversion Report',
    'overdue-analysis': 'Overdue Analysis'
  };

  return (
    <div>
      <div className="page-header">
        <h2>Reports & Analytics</h2>
      </div>

      <div className="card">
        <h3>Generate Report</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Report Type</label>
            <select className="form-control" value={reportType} onChange={(e) => setReportType(e.target.value)}>
              {Object.entries(reports).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>From Date</label>
            <input type="date" className="form-control" value={dateRange.from}
              onChange={(e) => setDateRange({...dateRange, from: e.target.value})} />
          </div>
          <div className="form-group">
            <label>To Date</label>
            <input type="date" className="form-control" value={dateRange.to}
              onChange={(e) => setDateRange({...dateRange, to: e.target.value})} />
          </div>
        </div>
        <button className="btn btn-primary">Generate Report</button>
        <button className="btn btn-secondary" style={{marginLeft: '0.5rem'}}>Export PDF</button>
        <button className="btn btn-secondary" style={{marginLeft: '0.5rem'}}>Export Excel</button>
      </div>

      <div className="card">
        <h3>Quick Reports</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <button className="btn btn-outline-primary">Today's Collections</button>
          <button className="btn btn-outline-primary">Monthly Disbursements</button>
          <button className="btn btn-outline-primary">Overdue Loans</button>
          <button className="btn btn-outline-primary">Lead Pipeline</button>
          <button className="btn btn-outline-primary">Branch Performance</button>
          <button className="btn btn-outline-primary">Employee Productivity</button>
        </div>
      </div>
    </div>
  );
}