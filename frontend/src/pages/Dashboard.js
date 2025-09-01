import React, { useEffect, useState } from 'react';
import api from '../services/api';
import '../App.css';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalCases: 0,
    totalDisbursement: 0,
    totalRepayment: 0,
    totalInterest: 0,
    activeLoans: 0,
    pendingInstallments: 0,
    overdueInstallments: 0
  });
  const [monthlyCollections, setMonthlyCollections] = useState([]);
  const [demandVsCollection, setDemandVsCollection] = useState([]);
  const [disbursedCases, setDisbursedCases] = useState([]);
  const [importPath, setImportPath] = useState('DATA/disbursed_cases.csv');
  const [importing, setImporting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchMonthlyCollections();
    fetchDemandVsCollection();
    fetchDisbursedCases();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyCollections = async () => {
    try {
      const response = await api.get('/installments/monthly-demand');
      setMonthlyCollections(response.data || []);
    } catch (error) {
      console.error('Error fetching monthly collections:', error);
      setMonthlyCollections([]);
    }
  };

  const fetchDemandVsCollection = async () => {
    try {
      const response = await api.get('/installments/monthly-demand');
      setDemandVsCollection(response.data || []);
    } catch (error) {
      console.error('Error fetching demand vs collection:', error);
      setDemandVsCollection([]);
    }
  };

  const fetchDisbursedCases = async () => {
    try {
      const response = await api.get('/disbursed-cases');
      setDisbursedCases(response.data || []);
    } catch (error) {
      console.error('Error fetching disbursed cases:', error);
      setDisbursedCases([]);
    }
  };

  const importFromFile = async () => {
    try {
      setImporting(true);
      const resp = await api.post('/disbursed-cases/import-file', { relativePath: importPath });
      await fetchDisbursedCases();
      if (resp && resp.data && resp.data.message) {
        alert(resp.data.message);
      }
    } catch (error) {
      console.error('Error importing disbursed cases:', error);
      alert('Failed to import disbursed cases. Ensure the path is correct and you have admin access.');
    } finally {
      setImporting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <button onClick={fetchStats} className="btn btn-primary">
          Refresh
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>{stats.totalCases}</h3>
          <p>Total Cases</p>
        </div>
        
        <div className="stat-card">
          <h3>{formatCurrency(stats.totalDisbursement)}</h3>
          <p>Total Disbursement</p>
        </div>
        
        <div className="stat-card">
          <h3>{formatCurrency(stats.totalRepayment)}</h3>
          <p>Total Repayment</p>
        </div>
        
        <div className="stat-card">
          <h3>{formatCurrency(stats.totalInterest)}</h3>
          <p>Total Interest</p>
        </div>
        
        <div className="stat-card">
          <h3>{stats.activeLoans}</h3>
          <p>Active Loans</p>
        </div>
        
        <div className="stat-card">
          <h3>{disbursedCases.length}</h3>
          <p>Disbursed Cases Till Date</p>
        </div>
        
        <div className="stat-card">
          <h3>{stats.pendingInstallments}</h3>
          <p>Pending Installments</p>
        </div>
        
        <div className="stat-card">
          <h3 style={{ color: '#dc3545' }}>{stats.overdueInstallments}</h3>
          <p>Overdue Installments</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Disbursed Cases</h3>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input
              type="text"
              value={importPath}
              onChange={(e) => setImportPath(e.target.value)}
              placeholder="DATA/disbursed_cases.csv"
              style={{ flex: 1, padding: '8px' }}
            />
            <button className="btn btn-primary" onClick={importFromFile} disabled={importing}>
              {importing ? 'Importing...' : 'Import from File'}
            </button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th><th>Loan ID</th><th>Customer</th><th>Branch</th><th>Net Disbursement</th><th>Repayment</th>
              </tr>
            </thead>
            <tbody>
              {disbursedCases.slice(0, 10).map((row) => (
                <tr key={row.id}>
                  <td>{row.date_of_disbursement}</td>
                  <td>{row.loan_id}</td>
                  <td>{row.customer_name}</td>
                  <td>{row.branch}</td>
                  <td>{formatCurrency(row.net_disbursement || 0)}</td>
                  <td>{formatCurrency(row.repayment_amount || 0)}</td>
                </tr>
              ))}
              {disbursedCases.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: '#888' }}>No disbursed cases found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Monthly Collections</h3>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Month</th><th>Demand</th><th>Collection</th><th>Pending</th><th>Collection %</th>
            </tr>
          </thead>
          <tbody>
            {monthlyCollections.map((month, index) => (
              <tr key={index}>
                <td>{month.month}</td>
                <td>{formatCurrency(month.demand)}</td>
                <td>{formatCurrency(month.collection)}</td>
                <td>{formatCurrency(month.pending)}</td>
                <td>{month.collection_percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Demand vs Collection Chart</h3>
        </div>
        <div style={{ padding: '20px' }}>
          <div className="chart-container">
            {demandVsCollection.map((data, index) => (
              <div key={index} className="chart-bar" style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span>{data.month}</span>
                  <span>Demand: {formatCurrency(data.demand)} | Collection: {formatCurrency(data.collection)}</span>
                </div>
                <div style={{ display: 'flex', height: '20px', backgroundColor: '#f0f0f0', borderRadius: '10px' }}>
                  <div 
                    style={{ 
                      width: `${(data.collection / data.demand) * 100}%`, 
                      backgroundColor: '#28a745', 
                      borderRadius: '10px',
                      minWidth: '2px'
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Loan Cycle Information</h3>
        </div>
        <div style={{ padding: '20px' }}>
          <div className="info-grid">
            <div className="info-item">
              <strong>Loan Cycle:</strong> 98 Days
            </div>
            <div className="info-item">
              <strong>Total Installments:</strong> 14
            </div>
            <div className="info-item">
              <strong>Installment Frequency:</strong> Every 7 Days
            </div>
            <div className="info-item">
              <strong>First Installment:</strong> 7th Day after Disbursement
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}