import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../App.css';
import { useNavigate } from 'react-router-dom';

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

const formatCSVDate = (val) => {
  if (!val) return '';
  // Expecting YYYY-MM-DD; fallback to parsing
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
    const [y, m, d] = val.split('-');
    return `${d}/${m}/${y}`;
  }
  const d = new Date(val);
  if (isNaN(d)) return String(val);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy}`;
};

export default function DisbursedCases() {
  const [disbursedCases, setDisbursedCases] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [dailySummary, setDailySummary] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDisbursedCases();
    fetchDailySummary();
  }, []);

  const fetchDisbursedCases = async () => {
    setLoading(true);
    try {
      const response = await api.get('/disbursed-cases');
      setDisbursedCases(response.data);
    } catch (error) {
      console.error('Error fetching disbursed cases:', error);
      alert('Error loading disbursed cases: ' + (error.response?.data?.error || error.message));
    }
    setLoading(false);
  };

  const fetchDailySummary = async () => {
    try {
      const response = await api.get('/disbursed-cases/daily');
      setDailySummary(response.data || []);
    } catch (error) {
      console.error('Error fetching daily disbursement summary:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('csvFile', file);

    setUploading(true);
    try {
      const response = await api.post('/disbursed-cases/upload-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(response.data.message);
      fetchDisbursedCases();
      setShowUpload(false);
    } catch (error) {
      alert('Error uploading CSV: ' + (error.response?.data?.error || error.message));
    }
    setUploading(false);
  };

  const filteredCases = disbursedCases.filter(loan => 
    loan.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.loan_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateDaysFromDisbursement = (disbursementDate) => {
    if (!disbursementDate) return 0;
    const today = new Date();
    const disbursed = new Date(disbursementDate);
    const diffTime = Math.abs(today - disbursed);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div>
      <div className="page-header">
        <h2>Disbursed Cases</h2>
        <div className="header-stats">
          <span className="stat-badge">Total: {filteredCases.length}</span>
          <span className="stat-badge">
            Amount: ₹{filteredCases.reduce((sum, loan) => sum + (loan.net_disbursement || 0), 0).toLocaleString()}
          </span>
          <button 
            onClick={() => setShowUpload(!showUpload)}
            className="btn btn-primary"
          >
            Upload CSV
          </button>
        </div>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by customer name or loan ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-control"
        />
      </div>

      {showUpload && (
        <div className="card form-card">
          <h3>Upload Disbursed Cases File</h3>
          <div className="form-group">
            <label>Select CSV or Excel File (.csv, .xlsx, .xls)</label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="form-control"
              disabled={uploading}
            />
            {uploading && <p className="loading">Uploading and processing CSV...</p>}
          </div>
        </div>
      )}

      <div className="card">
      <div className="card-header">
      <h3>Daily Disbursement (CSV Dates)</h3>
      </div>
      <div className="card-body">
      {dailySummary.length === 0 ? (
      <div className="loading">No daily disbursement data found</div>
      ) : (
      <table className="table">
      <thead>
      <tr>
      <th>Date (CSV)</th>
      <th>Day</th>
      <th>Cases</th>
      <th>Net Disbursed</th>
      <th>Loan Amount</th>
      <th>Repayment</th>
      </tr>
      </thead>
      <tbody>
      {dailySummary.map((d, idx) => (
      <tr key={idx}>
      <td>{d.date_formatted}</td>
      <td>{d.day_name}</td>
      <td>{d.total_cases}</td>
      <td>₹{(d.total_disbursed || 0).toLocaleString()}</td>
      <td>₹{(d.total_amount || 0).toLocaleString()}</td>
      <td>₹{(d.total_repayment || 0).toLocaleString()}</td>
      </tr>
      ))}
      </tbody>
      </table>
      )}
      </div>
      </div>
      
      <div className="card">
      <div className="card-header">
      <h3>All Disbursed Cases ({filteredCases.length})</h3>
        </div>
        {loading ? (
          <div className="loading">Loading disbursed cases...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Loan ID</th>
                <th>Customer</th>
                <th>Loan Amount</th>
                <th>Net Disbursed</th>
                <th>ROI</th>
                <th>Tenure</th>
                <th>Disbursement Date</th>
                <th>Days Since</th>
                <th>EMI Amount</th>
                <th>Total EMIs</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map(loan => (
                <tr key={loan.loan_id}>
                  <td>
                    <span
                      style={{ color: '#007bff', textDecoration: 'underline', cursor: 'pointer' }}
                      onClick={() => navigate(`/loans/${loan.loan_id}/details`)}
                    >
                      {loan.loan_id}
                    </span>
                  </td>
                  <td>{loan.customer_name}</td>
                  <td>₹{(loan.loan_amount || 0).toLocaleString()}</td>
                  <td>₹{(loan.net_disbursement || 0).toLocaleString()}</td>
                  <td>{loan.roi}%</td>
                  <td>{loan.tenure_days}d</td>
                  <td>{formatCSVDate(loan.date_of_disbursement)}</td>
                  <td>{calculateDaysFromDisbursement(loan.date_of_disbursement)}d</td>
                  <td>₹{(loan.installment_amount || 0).toLocaleString()}</td>
                  <td>{loan.no_of_installment}</td>
                  <td>
                    <span className="status-badge status-active">Active</span>
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