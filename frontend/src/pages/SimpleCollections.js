import React, { useState, useEffect } from 'react';
import axios from 'axios';
import t from '../utils/i18n';

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

export default function SimpleCollections() {
  const [summary, setSummary] = useState({});
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get summary data
      const summaryRes = await api.post('/collections/query', {
        query: `
          SELECT 
            COUNT(*) as total_installments,
            COUNT(CASE WHEN status = 'Paid' THEN 1 END) as paid_count,
            COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_count,
            COUNT(CASE WHEN status = 'Overdue' THEN 1 END) as overdue_count,
            SUM(amount) as total_amount,
            SUM(CASE WHEN status = 'Paid' THEN amount ELSE 0 END) as collected_amount,
            SUM(CASE WHEN status != 'Paid' THEN amount ELSE 0 END) as pending_amount
          FROM installments
        `
      });

      // Get monthly data
      const monthlyRes = await api.post('/collections/query', {
        query: `
          SELECT 
            DATE_FORMAT(due_date, '%Y-%m') as month,
            DATE_FORMAT(MIN(due_date), '%M %Y') as month_name,
            COUNT(*) as month_emis,
            SUM(amount) as month_amount,
            COUNT(CASE WHEN status = 'Paid' THEN 1 END) as month_paid,
            SUM(CASE WHEN status = 'Paid' THEN amount ELSE 0 END) as month_collected
          FROM installments 
          GROUP BY DATE_FORMAT(due_date, '%Y-%m')
          ORDER BY month DESC
          LIMIT 8
        `
      });

      setSummary(summaryRes.data[0] || {});
      setMonthly(monthlyRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₹${(amount || 0).toLocaleString()}`;
  };

  const formatPercentage = (collected, total) => {
    if (!total) return '0.00%';
    return `${((collected / total) * 100).toFixed(2)}%`;
  };

  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Loading...</div>;
  }

  const collectionRate = summary.total_amount ? 
    ((summary.collected_amount / summary.total_amount) * 100).toFixed(2) : 0;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Collection Summary</h2>
      
      {/* Summary Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px', 
        marginBottom: '30px' 
      }}>
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#333' }}>
            {summary.total_installments?.toLocaleString()}
          </div>
          <div style={{ color: '#666' }}>Total EMIs</div>
        </div>

        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#28a745' }}>
            {formatCurrency(summary.collected_amount)}
          </div>
          <div style={{ color: '#666' }}>Collected</div>
        </div>

        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#dc3545' }}>
            {formatCurrency(summary.pending_amount)}
          </div>
          <div style={{ color: '#666' }}>Pending</div>
        </div>

        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: '1.5em', 
            fontWeight: 'bold', 
            color: collectionRate >= 70 ? '#28a745' : collectionRate >= 50 ? '#ffc107' : '#dc3545'
          }}>
            {collectionRate}%
          </div>
          <div style={{ color: '#666' }}>Collection Rate</div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div style={{ 
        background: 'white', 
        padding: '20px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <h3>EMI Status Breakdown</h3>
        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
          <div>
            <strong>Paid:</strong> {summary.paid_count?.toLocaleString()} 
            ({formatPercentage(summary.paid_count, summary.total_installments)})
          </div>
          <div>
            <strong>Pending:</strong> {summary.pending_count?.toLocaleString()} 
            ({formatPercentage(summary.pending_count, summary.total_installments)})
          </div>
          <div>
            <strong>Overdue:</strong> {summary.overdue_count?.toLocaleString()} 
            ({formatPercentage(summary.overdue_count, summary.total_installments)})
          </div>
        </div>
      </div>

      {/* Monthly Performance */}
      <div style={{ 
        background: 'white', 
        padding: '20px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3>Monthly Collection Performance</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>{t('table.month')}</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>{t('table.emis')}</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>{t('table.amountDue')}</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>{t('table.collected')}</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>{t('table.collectionRate')}</th>
            </tr>
          </thead>
          <tbody>
            {monthly.map((month, index) => {
              const rate = month.month_amount ? ((month.month_collected / month.month_amount) * 100).toFixed(2) : 0;
              return (
                <tr key={index}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                    <strong>{month.month_name}</strong>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                    {month.month_emis?.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                    {formatCurrency(month.month_amount)}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                    {formatCurrency(month.month_collected)}
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    borderBottom: '1px solid #eee',
                    color: rate >= 70 ? '#28a745' : rate >= 50 ? '#ffc107' : '#dc3545',
                    fontWeight: 'bold'
                  }}>
                    {rate}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button 
          onClick={fetchData}
          style={{
            padding: '10px 20px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Refresh Data
        </button>
      </div>
    </div>
  );
}