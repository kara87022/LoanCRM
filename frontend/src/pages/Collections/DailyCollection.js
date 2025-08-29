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

export default function DailyCollection() {
  const [collections, setCollections] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyStats, setDailyStats] = useState({
    totalDue: 0,
    totalCollected: 0,
    pendingCount: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDailyCollections();
  }, [selectedDate]);

  const fetchDailyCollections = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/installments/due?date=${selectedDate}`);
      setCollections(response.data || []);
      setDailyStats({ totalDue: 0, totalCollected: 0, pendingCount: response.data?.length || 0 });
    } catch (error) {
      console.error('Error fetching daily collections:', error);
      setCollections([]);
      setDailyStats({ totalDue: 0, totalCollected: 0, pendingCount: 0 });
    } finally {
      setLoading(false);
    }
  };

  const recordPayment = async (installmentId, amount) => {
    try {
      await api.post('/payments', {
        installment_id: installmentId,
        amount: amount,
        payment_method: 'Cash',
        payment_date: selectedDate,
        remarks: `Daily collection for ${selectedDate}`
      });
      alert('Payment recorded successfully!');
      fetchDailyCollections();
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Error recording payment. Please try again.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div>
      <div className="page-header">
        <h2>Daily Collection</h2>
        <div className="header-actions">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="form-control"
            style={{ width: 'auto', display: 'inline-block' }}
          />
          <button onClick={fetchDailyCollections} className="btn btn-primary" style={{ marginLeft: '10px' }}>
            Refresh
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>{formatCurrency(dailyStats.totalDue)}</h3>
          <p>Total Due Today</p>
        </div>
        <div className="stat-card">
          <h3>{formatCurrency(dailyStats.totalCollected)}</h3>
          <p>Total Collected</p>
        </div>
        <div className="stat-card">
          <h3>{dailyStats.pendingCount}</h3>
          <p>Pending Collections</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Collections for {selectedDate} ({collections.length})</h3>
        </div>
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Loan ID</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Installment</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {collections.map((collection, index) => (
                <tr key={index}>
                  <td>{collection.loan_id}</td>
                  <td>{collection.customer_name}</td>
                  <td>{collection.phone || 'N/A'}</td>
                  <td>{collection.installment_number}</td>
                  <td>{formatCurrency(collection.amount)}</td>
                  <td>
                    <span className={`status-badge ${collection.status === 'Paid' ? 'status-paid' : 'status-pending'}`}>
                      {collection.status}
                    </span>
                  </td>
                  <td>
                    {collection.status === 'Pending' && (
                      <button
                        onClick={() => recordPayment(collection.installment_id, collection.amount)}
                        className="btn btn-sm btn-success"
                      >
                        Collect
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}