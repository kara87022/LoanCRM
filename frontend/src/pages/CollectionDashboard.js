import React, { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000/api'
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default function CollectionDashboard() {
  const [dashboardData, setDashboardData] = useState({
    summary: {},
    monthlyCollections: [],
    branchPerformance: [],
    overdueAnalysis: [],
    todayStats: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/collections/report');
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(2)}%`;
  };

  const getStatusColor = (percentage) => {
    if (percentage >= 90) return '#28a745';
    if (percentage >= 70) return '#ffc107';
    return '#dc3545';
  };

  if (loading) {
    return <div className="loading">Loading collection dashboard...</div>;
  }

  // Key insights from the data analysis
  const keyInsights = {
    totalLoans: 1253,
    totalDisbursement: 33219648,
    totalRepaymentExpected: 45196800,
    totalInterest: 7532800,
    avgLoanAmount: 30059,
    avgROI: 20,
    uniqueBranches: 29,
    topBranches: [
      { name: 'KANPUR', loans: 215, amount: 6076000 },
      { name: 'SAHARANPUR', loans: 146, amount: 4350000 },
      { name: 'MEERUT', loans: 124, amount: 3619000 },
      { name: 'PANCHSHEEL PARK', loans: 6, amount: 2650000 },
      { name: 'VARANASI', loans: 90, amount: 2527000 }
    ],
    monthlyProjections: [
      { month: 'July 2025', emis: 5182, expected: 13795680 },
      { month: 'August 2025', emis: 4125, expected: 9757187 },
      { month: 'September 2025', emis: 3500, expected: 8500000 },
      { month: 'October 2025', emis: 2800, expected: 7200000 }
    ]
  };

  return (
    <div className="collection-dashboard">
      <div className="page-header">
        <h2>Collection Dashboard</h2>
        <div className="header-actions">
          <button onClick={fetchDashboardData} className="btn btn-primary">
            Refresh Data
          </button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="kpi-section">
        <h3>Key Performance Indicators</h3>
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-value">{keyInsights.totalLoans.toLocaleString()}</div>
            <div className="kpi-label">Total Active Loans</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value">{formatCurrency(keyInsights.totalDisbursement)}</div>
            <div className="kpi-label">Total Disbursed</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value">{formatCurrency(keyInsights.totalRepaymentExpected)}</div>
            <div className="kpi-label">Expected Repayment</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value">{formatCurrency(keyInsights.totalInterest)}</div>
            <div className="kpi-label">Total Interest</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value">{formatCurrency(keyInsights.avgLoanAmount)}</div>
            <div className="kpi-label">Avg Loan Amount</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value">{keyInsights.avgROI}%</div>
            <div className="kpi-label">Average ROI</div>
          </div>
        </div>
      </div>

      {/* Today's Collection Status */}
      <div className="today-section">
        <h3>Today's Collection Status</h3>
        <div className="today-grid">
          <div className="today-card">
            <div className="today-value">{formatCurrency(dashboardData.todayStats.total_demand || 0)}</div>
            <div className="today-label">Total Due Today</div>
          </div>
          <div className="today-card">
            <div className="today-value">{formatCurrency(dashboardData.todayStats.collected || 0)}</div>
            <div className="today-label">Collected Today</div>
          </div>
          <div className="today-card">
            <div className="today-value">{formatCurrency(dashboardData.todayStats.pending || 0)}</div>
            <div className="today-label">Pending Today</div>
          </div>
          <div className="today-card">
            <div className="today-value" style={{ color: getStatusColor(dashboardData.todayStats.collection_percentage) }}>
              {formatPercentage(dashboardData.todayStats.collection_percentage)}
            </div>
            <div className="today-label">Collection Rate</div>
          </div>
        </div>
      </div>

      {/* Monthly Collection Projections */}
      <div className="projections-section">
        <h3>Monthly Collection Projections</h3>
        <div className="projections-table">
          <table className="table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Expected EMIs</th>
                <th>Projected Collection</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {keyInsights.monthlyProjections.map((proj, index) => (
                <tr key={index}>
                  <td><strong>{proj.month}</strong></td>
                  <td>{proj.emis.toLocaleString()}</td>
                  <td>{formatCurrency(proj.expected)}</td>
                  <td>
                    <span className="status-badge status-projected">Projected</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Branch Performance */}
      <div className="branch-section">
        <h3>Top Performing Branches</h3>
        <div className="branch-grid">
          {keyInsights.topBranches.map((branch, index) => (
            <div key={index} className="branch-card">
              <div className="branch-rank">#{index + 1}</div>
              <div className="branch-name">{branch.name}</div>
              <div className="branch-stats">
                <div className="branch-loans">{branch.loans} loans</div>
                <div className="branch-amount">{formatCurrency(branch.amount)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Collections Actual vs Projected */}
      {dashboardData.monthlyCollections && dashboardData.monthlyCollections.length > 0 && (
        <div className="monthly-section">
          <h3>Monthly Collection Performance</h3>
          <div className="monthly-table">
            <table className="table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Total EMIs</th>
                  <th>Demand</th>
                  <th>Collected</th>
                  <th>Pending</th>
                  <th>Collection %</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.monthlyCollections.slice(0, 6).map((month, index) => (
                  <tr key={index}>
                    <td><strong>{month.month_name}</strong></td>
                    <td>{month.total_emis}</td>
                    <td>{formatCurrency(month.total_demand)}</td>
                    <td>{formatCurrency(month.collected)}</td>
                    <td>{formatCurrency(month.pending)}</td>
                    <td>
                      <span style={{ color: getStatusColor(month.collection_percentage) }}>
                        {formatPercentage(month.collection_percentage)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Overdue Analysis */}
      {dashboardData.overdueAnalysis && dashboardData.overdueAnalysis.length > 0 && (
        <div className="overdue-section">
          <h3>Overdue Analysis</h3>
          <div className="overdue-grid">
            {dashboardData.overdueAnalysis.map((bucket, index) => (
              <div key={index} className="overdue-card">
                <div className="overdue-period">{bucket.overdue_bucket}</div>
                <div className="overdue-count">{bucket.count} EMIs</div>
                <div className="overdue-amount">{formatCurrency(bucket.overdue_amount)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .collection-dashboard {
          padding: 20px;
          background: #f8f9fa;
          min-height: 100vh;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .page-header h2 {
          margin: 0;
          color: #333;
        }

        .kpi-section, .today-section, .projections-section, .branch-section, .monthly-section, .overdue-section {
          margin-bottom: 30px;
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .kpi-section h3, .today-section h3, .projections-section h3, .branch-section h3, .monthly-section h3, .overdue-section h3 {
          margin: 0 0 20px 0;
          color: #333;
          font-size: 1.3em;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .kpi-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }

        .kpi-value {
          font-size: 1.8em;
          font-weight: bold;
          margin-bottom: 5px;
        }

        .kpi-label {
          font-size: 0.9em;
          opacity: 0.9;
        }

        .today-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .today-card {
          background: #f8f9fa;
          border: 2px solid #e9ecef;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }

        .today-value {
          font-size: 1.5em;
          font-weight: bold;
          margin-bottom: 5px;
          color: #333;
        }

        .today-label {
          font-size: 0.9em;
          color: #666;
        }

        .branch-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
        }

        .branch-card {
          background: #f8f9fa;
          border-left: 4px solid #007bff;
          padding: 15px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .branch-rank {
          background: #007bff;
          color: white;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }

        .branch-name {
          font-weight: bold;
          color: #333;
          flex: 1;
        }

        .branch-stats {
          text-align: right;
        }

        .branch-loans {
          font-size: 0.9em;
          color: #666;
        }

        .branch-amount {
          font-weight: bold;
          color: #333;
        }

        .overdue-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .overdue-card {
          background: #fff5f5;
          border: 2px solid #fed7d7;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
        }

        .overdue-period {
          font-weight: bold;
          color: #e53e3e;
          margin-bottom: 5px;
        }

        .overdue-count {
          font-size: 0.9em;
          color: #666;
          margin-bottom: 5px;
        }

        .overdue-amount {
          font-weight: bold;
          color: #333;
        }

        .table {
          width: 100%;
          border-collapse: collapse;
        }

        .table th,
        .table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e9ecef;
        }

        .table th {
          background: #f8f9fa;
          font-weight: 600;
          color: #333;
        }

        .table tbody tr:hover {
          background: #f8f9fa;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8em;
          font-weight: 500;
        }

        .status-projected {
          background: #e3f2fd;
          color: #1976d2;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn:hover {
          opacity: 0.9;
        }

        .loading {
          text-align: center;
          padding: 50px;
          font-size: 1.2em;
          color: #666;
        }
      `}</style>
    </div>
  );
}