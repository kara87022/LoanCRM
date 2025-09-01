import React, { useEffect, useMemo, useState } from 'react';
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

  // Filters & sorting
  const [filterBranch, setFilterBranch] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');

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

  const branchOptions = useMemo(() => Array.from(new Set((disbursedCases || []).map(l => l.branch).filter(Boolean))), [disbursedCases]);
  const statusOptions = useMemo(() => Array.from(new Set((disbursedCases || []).map(l => l.status || 'Active').filter(Boolean))), [disbursedCases]);

  const filteredSortedCases = useMemo(() => {
    const term = (searchTerm || '').toLowerCase().trim();
    const from = filterFrom ? new Date(filterFrom) : null;
    const to = filterTo ? new Date(filterTo) : null;

    const filtered = (disbursedCases || []).filter(loan => {
      const matchSearch = !term || (loan.customer_name || '').toLowerCase().includes(term) || (loan.loan_id || '').toLowerCase().includes(term) || (loan.branch || '').toLowerCase().includes(term);
      const matchBranch = filterBranch === 'All' || (loan.branch || '') === filterBranch;
      const matchStatus = filterStatus === 'All' || String(loan.status || 'Active') === filterStatus;
      const disbDate = loan.date_of_disbursement ? new Date(loan.date_of_disbursement) : null;
      const matchFrom = !from || (disbDate && disbDate >= from);
      const matchTo = !to || (disbDate && disbDate <= to);
      return matchSearch && matchBranch && matchStatus && matchFrom && matchTo;
    });

    const sorted = [...filtered].sort((a, b) => {
      const aDate = a.date_of_disbursement ? new Date(a.date_of_disbursement) : new Date(0);
      const bDate = b.date_of_disbursement ? new Date(b.date_of_disbursement) : new Date(0);
      switch (sortBy) {
        case 'date_asc':
          return aDate - bDate;
        case 'date_desc':
          return bDate - aDate;
        case 'amount_desc':
          return (b.loan_amount || 0) - (a.loan_amount || 0);
        case 'amount_asc':
          return (a.loan_amount || 0) - (b.loan_amount || 0);
        case 'net_desc':
          return (b.net_disbursement || 0) - (a.net_disbursement || 0);
        case 'net_asc':
          return (a.net_disbursement || 0) - (b.net_disbursement || 0);
        case 'branch_asc':
          return (a.branch || '').localeCompare(b.branch || '');
        case 'branch_desc':
          return (b.branch || '').localeCompare(a.branch || '');
        case 'customer_asc':
          return (a.customer_name || '').localeCompare(b.customer_name || '');
        case 'customer_desc':
          return (b.customer_name || '').localeCompare(a.customer_name || '');
        default:
          return bDate - aDate;
      }
    });
    return sorted;
  }, [disbursedCases, searchTerm, filterBranch, filterStatus, filterFrom, filterTo, sortBy]);

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
          <span className="stat-badge">Total: {filteredSortedCases.length}</span>
          <span className="stat-badge">
            Amount: ₹{filteredSortedCases.reduce((sum, loan) => sum + (loan.net_disbursement || 0), 0).toLocaleString()}
          </span>
          <button 
            onClick={() => setShowUpload(!showUpload)}
            className="btn btn-primary"
          >
            Upload CSV
          </button>
        </div>
      </div>

      <div className="card form-card">
        <h3>Filter & Sort</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search by Loan ID / Customer / Branch"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label>Branch</label>
            <select className="form-control" value={filterBranch} onChange={(e)=>setFilterBranch(e.target.value)}>
              <option>All</option>
              {branchOptions.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select className="form-control" value={filterStatus} onChange={(e)=>setFilterStatus(e.target.value)}>
              <option>All</option>
              {statusOptions.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>From Date</label>
            <input type="date" className="form-control" value={filterFrom} onChange={(e)=>setFilterFrom(e.target.value)} />
          </div>
          <div className="form-group">
            <label>To Date</label>
            <input type="date" className="form-control" value={filterTo} onChange={(e)=>setFilterTo(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Sort By</label>
            <select className="form-control" value={sortBy} onChange={(e)=>setSortBy(e.target.value)}>
              <option value="date_desc">Disbursed (Newest)</option>
              <option value="date_asc">Disbursed (Oldest)</option>
              <option value="amount_desc">Loan Amount (High-Low)</option>
              <option value="amount_asc">Loan Amount (Low-High)</option>
              <option value="net_desc">Net Disbursed (High-Low)</option>
              <option value="net_asc">Net Disbursed (Low-High)</option>
              <option value="customer_asc">Customer (A-Z)</option>
              <option value="customer_desc">Customer (Z-A)</option>
              <option value="branch_asc">Branch (A-Z)</option>
              <option value="branch_desc">Branch (Z-A)</option>
            </select>
          </div>
        </div>
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
          <h3>All Disbursed Cases ({filteredSortedCases.length})</h3>
        </div>
        {loading ? (
          <div className="loading">Loading disbursed cases...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Loan ID</th>
                <th>Customer</th>
                <th>Branch</th>
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
              {filteredSortedCases.map(loan => (
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
                  <td>{loan.branch || '-'}</td>
                  <td>₹{(loan.loan_amount || 0).toLocaleString()}</td>
                  <td>₹{(loan.net_disbursement || 0).toLocaleString()}</td>
                  <td>{loan.roi}%</td>
                  <td>{loan.tenure_days}d</td>
                  <td>{formatCSVDate(loan.date_of_disbursement)}</td>
                  <td>{calculateDaysFromDisbursement(loan.date_of_disbursement)}d</td>
                  <td>₹{(loan.installment_amount || 0).toLocaleString()}</td>
                  <td>{loan.no_of_installment || loan.total_installments || '-'}</td>
                  <td>
                    <span className="status-badge status-active">{loan.status || 'Active'}</span>
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
