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

export default function RealTimeCollections() {
  const [data, setData] = useState({
    summary: {},
    monthly: [],
    today: {},
    recent: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRealTimeData();
    const interval = setInterval(fetchRealTimeData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchRealTimeData = async () => {
    try {
      // Get real collection data
      const summaryQuery = `
        SELECT 
          COUNT(*) as total_installments,
          COUNT(CASE WHEN status = 'Paid' THEN 1 END) as paid_count,
          COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_count,
          COUNT(CASE WHEN status = 'Overdue' THEN 1 END) as overdue_count,
          SUM(amount) as total_amount,
          SUM(CASE WHEN status = 'Paid' THEN amount ELSE 0 END) as collected_amount,
          SUM(CASE WHEN status != 'Paid' THEN amount ELSE 0 END) as pending_amount
        FROM installments
      `;

      const todayQuery = `
        SELECT 
          COUNT(*) as today_emis,
          SUM(amount) as today_amount,
          COUNT(CASE WHEN status = 'Paid' THEN 1 END) as today_paid,
          SUM(CASE WHEN status = 'Paid' THEN amount ELSE 0 END) as today_collected
        FROM installments 
        WHERE DATE(due_date) = CURDATE()
      `;

      const monthlyQuery = `
        SELECT 
          DATE_FORMAT(due_date, '%Y-%m') as month,
          DATE_FORMAT(due_date, '%M %Y') as month_name,
          COUNT(*) as month_emis,
          SUM(amount) as month_amount,
          COUNT(CASE WHEN status = 'Paid' THEN 1 END) as month_paid,
          SUM(CASE WHEN status = 'Paid' THEN amount ELSE 0 END) as month_collected,
          ROUND((SUM(CASE WHEN status = 'Paid' THEN amount ELSE 0 END) / SUM(amount)) * 100, 2) as collection_rate
        FROM installments 
        GROUP BY DATE_FORMAT(due_date, '%Y-%m')
        ORDER BY month DESC
        LIMIT 6
      `;

      const recentQuery = `
        SELECT 
          i.loan_id, l.customer_name, i.amount, i.due_date, i.status,
          DATEDIFF(CURDATE(), i.due_date) as days_overdue
        FROM installments i
        JOIN loans_master l ON i.loan_id = l.loan_id
        WHERE i.status IN ('Pending', 'Overdue')
        ORDER BY i.due_date ASC
        LIMIT 20
      `;

      // Execute queries (you'll need to create API endpoints for these)
      const [summaryRes, todayRes, monthlyRes, recentRes] = await Promise.all([
        api.post('/collections/query', { query: summaryQuery }),
        api.post('/collections/query', { query: todayQuery }),
        api.post('/collections/query', { query: monthlyQuery }),
        api.post('/collections/query', { query: recentQuery })
      ]);

      setData({
        summary: summaryRes.data[0] || {},
        today: todayRes.data[0] || {},
        monthly: monthlyRes.data || [],
        recent: recentRes.data || []
      });

    } catch (error) {
      console.error('Error fetching real-time data:', error);
      // Fallback to existing API
      try {
        const response = await api.get('/collections/report');
        if (response.data.success) {
          setData({
            summary: response.data.data.summary || {},
            today: response.data.data.todayStats || {},
            monthly: response.data.data.monthlyCollections || [],
            recent: []
          });
        }
      } catch (fallbackError) {
        console.error('Fallback API also failed:', fallbackError);
      }
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
    return <div className="loading">Loading real-time collection data...</div>;
  }

  const collectionRate = data.summary.total_amount ? 
    ((data.summary.collected_amount / data.summary.total_amount) * 100) : 0;

  return (
    <div className="real-time-collections">
      <div className="page-header">
        <h2>Real-Time Collections</h2>
        <div className="last-updated">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card total">
          <div className="metric-value">{data.summary.total_installments?.toLocaleString()}</div>
          <div className="metric-label">Total EMIs</div>
        </div>
        <div className="metric-card collected">
          <div className="metric-value">{formatCurrency(data.summary.collected_amount)}</div>
          <div className="metric-label">Collected</div>
        </div>
        <div className="metric-card pending">
          <div className="metric-value">{formatCurrency(data.summary.pending_amount)}</div>
          <div className="metric-label">Pending</div>
        </div>
        <div className="metric-card rate">
          <div className="metric-value" style={{ color: getStatusColor(collectionRate) }}>
            {formatPercentage(collectionRate)}
          </div>
          <div className="metric-label">Collection Rate</div>
        </div>
      </div>

      {/* Today's Status */}
      <div className="today-section">
        <h3>Today's Collections</h3>
        <div className="today-grid">
          <div className="today-item">
            <span className="today-label">EMIs Due:</span>
            <span className="today-value">{data.today.today_emis}</span>
          </div>
          <div className="today-item">
            <span className="today-label">Amount Due:</span>
            <span className="today-value">{formatCurrency(data.today.today_amount)}</span>
          </div>
          <div className="today-item">
            <span className="today-label">Collected:</span>
            <span className="today-value">{formatCurrency(data.today.today_collected)}</span>
          </div>
          <div className="today-item">
            <span className="today-label">Paid EMIs:</span>
            <span className="today-value">{data.today.today_paid}</span>
          </div>
        </div>
      </div>

      {/* Monthly Performance */}
      <div className="monthly-section">
        <h3>Monthly Collection Performance</h3>
        <table className="collection-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>EMIs</th>
              <th>Amount Due</th>
              <th>Collected</th>
              <th>Rate</th>
            </tr>
          </thead>
          <tbody>
            {data.monthly.map((month, index) => (
              <tr key={index}>
                <td>{month.month_name}</td>
                <td>{month.month_emis}</td>
                <td>{formatCurrency(month.month_amount)}</td>
                <td>{formatCurrency(month.month_collected)}</td>
                <td style={{ color: getStatusColor(month.collection_rate) }}>
                  {formatPercentage(month.collection_rate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent Pending EMIs */}
      {data.recent.length > 0 && (
        <div className="recent-section">
          <h3>Recent Pending EMIs</h3>
          <table className="collection-table">
            <thead>
              <tr>
                <th>Loan ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Days Overdue</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recent.map((emi, index) => (
                <tr key={index}>
                  <td>{emi.loan_id}</td>
                  <td>{emi.customer_name}</td>
                  <td>{formatCurrency(emi.amount)}</td>
                  <td>{new Date(emi.due_date).toLocaleDateString()}</td>
                  <td>{emi.days_overdue > 0 ? emi.days_overdue : 0}</td>
                  <td>
                    <span className={`status-badge ${emi.status.toLowerCase()}`}>
                      {emi.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .real-time-collections {
          padding: 20px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .last-updated {
          font-size: 0.9em;
          color: #666;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .metric-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-align: center;
        }

        .metric-value {
          font-size: 1.8em;
          font-weight: bold;
          margin-bottom: 5px;
        }

        .metric-label {
          color: #666;
          font-size: 0.9em;
        }

        .today-section, .monthly-section, .recent-section {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }

        .today-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .today-item {
          display: flex;
          justify-content: space-between;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 4px;
        }

        .today-label {
          color: #666;
        }

        .today-value {
          font-weight: bold;
        }

        .collection-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }

        .collection-table th,
        .collection-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e9ecef;
        }

        .collection-table th {
          background: #f8f9fa;
          font-weight: 600;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8em;
          font-weight: 500;
        }

        .status-badge.paid {
          background: #d4edda;
          color: #155724;
        }

        .status-badge.pending {
          background: #fff3cd;
          color: #856404;
        }

        .status-badge.overdue {
          background: #f8d7da;
          color: #721c24;
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