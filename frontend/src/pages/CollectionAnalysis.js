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

export default function CollectionAnalysis() {
  const [activeTab, setActiveTab] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    monthly: [],
    daily: [],
    branchWise: [],
    overdue: [],
    trends: [],
    todaySummary: {}
  });
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [monthlyRes, dailyRes, branchRes, overdueRes, trendsRes, todayRes] = await Promise.all([
        api.get('/collections/monthly'),
        api.get('/collections/daily'),
        api.get('/collections/branch-wise'),
        api.get('/collections/overdue-analysis'),
        api.get('/collections/trends'),
        api.get('/collections/today')
      ]);

      setData({
        monthly: monthlyRes.data.data || [],
        daily: dailyRes.data.data || [],
        branchWise: branchRes.data.data || [],
        overdue: overdueRes.data.data || [],
        trends: trendsRes.data.data || [],
        todaySummary: todayRes.data.data || {}
      });
    } catch (error) {
      console.error('Error fetching collection data:', error);
      alert('Error fetching collection data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyWithDateRange = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      alert('Please select both start and end dates');
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/collections/daily?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      setData(prev => ({
        ...prev,
        daily: response.data.data || []
      }));
    } catch (error) {
      console.error('Error fetching daily data:', error);
      alert('Error fetching daily data. Please try again.');
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
    return <div className="loading">Loading collection analysis...</div>;
  }

  return (
    <div className="collection-analysis">
      <div className="page-header">
        <h2>Collection Analysis</h2>
        <div className="header-actions">
          <button onClick={fetchData} className="btn btn-primary">
            Refresh Data
          </button>
        </div>
      </div>

      {/* Today's Summary */}
      <div className="today-summary">
        <h3>Today's Collection Summary</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <h4>{formatCurrency(data.todaySummary.total_demand)}</h4>
            <p>Total Demand</p>
          </div>
          <div className="stat-card">
            <h4>{formatCurrency(data.todaySummary.collected)}</h4>
            <p>Collected</p>
          </div>
          <div className="stat-card">
            <h4>{formatCurrency(data.todaySummary.pending)}</h4>
            <p>Pending</p>
          </div>
          <div className="stat-card">
            <h4 style={{ color: getStatusColor(data.todaySummary.collection_percentage) }}>
              {formatPercentage(data.todaySummary.collection_percentage)}
            </h4>
            <p>Collection Rate</p>
          </div>
          <div className="stat-card">
            <h4>{data.todaySummary.total_emis_due || 0}</h4>
            <p>EMIs Due</p>
          </div>
          <div className="stat-card">
            <h4>{data.todaySummary.unique_loans || 0}</h4>
            <p>Unique Loans</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs">
        <button 
          className={activeTab === 'monthly' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('monthly')}
        >
          Monthly Analysis
        </button>
        <button 
          className={activeTab === 'daily' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('daily')}
        >
          Daily Analysis
        </button>
        <button 
          className={activeTab === 'branch' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('branch')}
        >
          Branch Performance
        </button>
        <button 
          className={activeTab === 'overdue' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('overdue')}
        >
          Overdue Analysis
        </button>
        <button 
          className={activeTab === 'trends' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('trends')}
        >
          Collection Trends
        </button>
      </div>

      {/* Monthly Analysis */}
      {activeTab === 'monthly' && (
        <div className="card">
          <div className="card-header">
            <h3>Monthly Collection Analysis ({data.monthly.length} months)</h3>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Total EMIs</th>
                <th>Unique Loans</th>
                <th>Demand</th>
                <th>Collected</th>
                <th>Pending</th>
                <th>Collection %</th>
                <th>Paid EMIs</th>
                <th>Pending EMIs</th>
              </tr>
            </thead>
            <tbody>
              {data.monthly.map((month, index) => (
                <tr key={index}>
                  <td><strong>{month.month_name}</strong></td>
                  <td>{month.total_emis}</td>
                  <td>{month.unique_loans}</td>
                  <td>{formatCurrency(month.total_demand)}</td>
                  <td>{formatCurrency(month.collected)}</td>
                  <td>{formatCurrency(month.pending)}</td>
                  <td>
                    <span style={{ color: getStatusColor(month.collection_percentage) }}>
                      {formatPercentage(month.collection_percentage)}
                    </span>
                  </td>
                  <td>{month.paid_emis}</td>
                  <td>{month.pending_emis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Daily Analysis */}
      {activeTab === 'daily' && (
        <div className="card">
          <div className="card-header">
            <h3>Daily Collection Analysis</h3>
            <div className="date-filters">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="form-control"
              />
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="form-control"
              />
              <button onClick={fetchDailyWithDateRange} className="btn btn-secondary">
                Filter
              </button>
            </div>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Day</th>
                <th>EMIs</th>
                <th>Loans</th>
                <th>Demand</th>
                <th>Collected</th>
                <th>Pending</th>
                <th>Collection %</th>
              </tr>
            </thead>
            <tbody>
              {data.daily.map((day, index) => (
                <tr key={index}>
                  <td>{day.date_formatted}</td>
                  <td>{day.day_name}</td>
                  <td>{day.total_emis}</td>
                  <td>{day.unique_loans}</td>
                  <td>{formatCurrency(day.total_demand)}</td>
                  <td>{formatCurrency(day.collected)}</td>
                  <td>{formatCurrency(day.pending)}</td>
                  <td>
                    <span style={{ color: getStatusColor(day.collection_percentage) }}>
                      {formatPercentage(day.collection_percentage)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Branch Performance */}
      {activeTab === 'branch' && (
        <div className="card">
          <div className="card-header">
            <h3>Branch-wise Collection Performance</h3>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Branch</th>
                <th>Total EMIs</th>
                <th>Unique Loans</th>
                <th>Total Demand</th>
                <th>Collected</th>
                <th>Pending</th>
                <th>Collection %</th>
              </tr>
            </thead>
            <tbody>
              {data.branchWise.map((branch, index) => (
                <tr key={index}>
                  <td><strong>{branch.branch}</strong></td>
                  <td>{branch.total_emis}</td>
                  <td>{branch.unique_loans}</td>
                  <td>{formatCurrency(branch.total_demand)}</td>
                  <td>{formatCurrency(branch.collected)}</td>
                  <td>{formatCurrency(branch.pending)}</td>
                  <td>
                    <span style={{ color: getStatusColor(branch.collection_percentage) }}>
                      {formatPercentage(branch.collection_percentage)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Overdue Analysis */}
      {activeTab === 'overdue' && (
        <div className="card">
          <div className="card-header">
            <h3>Overdue Analysis</h3>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Overdue Period</th>
                <th>Count</th>
                <th>Unique Loans</th>
                <th>Overdue Amount</th>
                <th>Avg Days Overdue</th>
              </tr>
            </thead>
            <tbody>
              {data.overdue.map((bucket, index) => (
                <tr key={index}>
                  <td><strong>{bucket.overdue_bucket}</strong></td>
                  <td>{bucket.count}</td>
                  <td>{bucket.unique_loans}</td>
                  <td>{formatCurrency(bucket.overdue_amount)}</td>
                  <td>{bucket.avg_days_overdue} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Collection Trends */}
      {activeTab === 'trends' && (
        <div className="card">
          <div className="card-header">
            <h3>Collection Trends (Last 12 Months)</h3>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Demand</th>
                <th>Collected</th>
                <th>Collection Rate</th>
                <th>Active Loans</th>
              </tr>
            </thead>
            <tbody>
              {data.trends.map((trend, index) => (
                <tr key={index}>
                  <td><strong>{trend.month}</strong></td>
                  <td>{formatCurrency(trend.demand)}</td>
                  <td>{formatCurrency(trend.collected)}</td>
                  <td>
                    <span style={{ color: getStatusColor(trend.collection_rate) }}>
                      {formatPercentage(trend.collection_rate)}
                    </span>
                  </td>
                  <td>{trend.active_loans}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .collection-analysis {
          padding: 20px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .today-summary {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .today-summary h3 {
          margin-bottom: 15px;
          color: #333;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .stat-card {
          background: white;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .stat-card h4 {
          margin: 0 0 5px 0;
          font-size: 1.5em;
          font-weight: bold;
        }

        .stat-card p {
          margin: 0;
          color: #666;
          font-size: 0.9em;
        }

        .tabs {
          display: flex;
          margin-bottom: 20px;
          border-bottom: 2px solid #e9ecef;
        }

        .tab {
          padding: 12px 20px;
          border: none;
          background: none;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          font-weight: 500;
        }

        .tab.active {
          border-bottom-color: #007bff;
          color: #007bff;
        }

        .tab:hover {
          background: #f8f9fa;
        }

        .card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        .card-header {
          padding: 20px;
          background: #f8f9fa;
          border-bottom: 1px solid #e9ecef;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .card-header h3 {
          margin: 0;
          color: #333;
        }

        .date-filters {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .date-filters input {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
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

        .btn-secondary {
          background: #6c757d;
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

        .form-control {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}