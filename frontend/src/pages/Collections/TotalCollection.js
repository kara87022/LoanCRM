import React, { useEffect, useState } from 'react';
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

export default function TotalCollection() {
  const [collections, setCollections] = useState([]);
  const [stats, setStats] = useState({
    totalCollected: 0,
    totalPending: 0,
    collectionRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollections();
    fetchStats();
  }, []);

  const fetchCollections = async () => {
    try {
      const response = await api.get('/installments/due');
      setCollections(response.data || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
      setCollections([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/installments/stats');
      setStats(response.data || { totalCollected: 0, totalPending: 0, collectionRate: 0 });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({ totalCollected: 0, totalPending: 0, collectionRate: 0 });
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
    return <div className="loading">Loading collections...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>Total Collection</h2>
        <button onClick={fetchCollections} className="btn btn-primary">
          Refresh
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>{formatCurrency(stats.totalCollected)}</h3>
          <p>Total Collected</p>
        </div>
        <div className="stat-card">
          <h3>{formatCurrency(stats.totalPending)}</h3>
          <p>Total Pending</p>
        </div>
        <div className="stat-card">
          <h3>{stats.collectionRate}%</h3>
          <p>Collection Rate</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>All Collections ({collections.length})</h3>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Loan ID</th>
              <th>Customer</th>
              <th>Installment</th>
              <th>Due Date</th>
              <th>Amount</th>
              <th>Collected</th>
              <th>Status</th>
              <th>Days Overdue</th>
            </tr>
          </thead>
          <tbody>
            {collections.map((collection, index) => (
              <tr key={index}>
                <td>{collection.loan_id}</td>
                <td>{collection.customer_name}</td>
                <td>{collection.installment_number}</td>
                <td>{collection.due_date}</td>
                <td>{formatCurrency(collection.amount)}</td>
                <td>{formatCurrency(collection.collected_amount || 0)}</td>
                <td>
                  <span className={`status-badge ${collection.status === 'Paid' ? 'status-paid' : collection.status === 'Pending' ? 'status-pending' : 'status-overdue'}`}>
                    {collection.status}
                  </span>
                </td>
                <td>{collection.days_overdue || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}