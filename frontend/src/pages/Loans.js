import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import '../App.css';
import { useNavigate } from 'react-router-dom';

// Simple translation function
const t = (key) => key;

// Simple date formatter
const formatCSVDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB');
};

export default function Loans() {
  const { t } = useTranslation();
  const [loans, setLoans] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [monthlyData, setMonthlyData] = useState([]);
  const [collectionDemand, setCollectionDemand] = useState([]);
  const [realCollectionData, setRealCollectionData] = useState([]);
  const [formData, setFormData] = useState({
    loan_id: '',
    branch: '',
    sourced_by: '',
    customer_name: '',
    loan_amount: '',
    processing_fee: '',
    gst: '',
    net_disbursement: '',
    repayment_amount: '',
    interest_earned: '',
    roi: '',
    tenure_days: '',
    date_of_disbursement: '',
    installment_amount: '',
    total_installments: ''
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef(null);
  const [nocVisible, setNocVisible] = useState(false);
  const [nocData, setNocData] = useState(null); // { loan, noc }
  const navigate = useNavigate();
  // Filters and sorting
  const [filterBranch, setFilterBranch] = useState('All');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterProduct, setFilterProduct] = useState('All');
  const [sortBy, setSortBy] = useState('date_desc');

  useEffect(() => {
    fetchLoans();
    fetchMonthlyData();
    fetchCollectionDemand();
    fetchRealCollectionData();
  }, []);

  const fetchLoans = async () => {
    try {
      console.log('Fetching loans data...');
      const response = await api.get('/loans');
      console.log('Loans data received:', response.data.length, 'records');
      setLoans(response.data);
    } catch (error) {
      console.error('Error fetching loans:', error);
      if (error.code === 'ERR_NETWORK' || error.message.includes('ERR_CONNECTION_REFUSED')) {
        alert('Backend server is not running. Please start the backend server on port 4000.');
      } else {
        alert('Error loading loans data: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingLoan) {
        await api.put(`/loans/${editingLoan.loan_id}`, formData);
        alert('Loan updated successfully!');
      } else {
        await api.post('/loans', formData);
        alert('Loan created successfully!');
      }
      resetForm();
      fetchLoans();
    } catch (error) {
      alert('Error saving loan: ' + error.response?.data?.error);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      loan_id: '',
      branch: '',
      sourced_by: '',
      customer_name: '',
      loan_amount: '',
      processing_fee: '',
      gst: '',
      net_disbursement: '',
      repayment_amount: '',
      interest_earned: '',
      roi: '',
      tenure_days: '',
      date_of_disbursement: '',
      installment_amount: '',
      total_installments: ''
    });
    setShowForm(false);
    setEditingLoan(null);
  };

  const handleEdit = (loan) => {
    setEditingLoan(loan);
    setFormData(loan);
    setShowForm(true);
  };

  const generateInstallments = async (loanId) => {
    try {
      const loan = loans.find(l => l.loan_id === loanId);
      
      if (!loan.loan_amount || !loan.date_of_disbursement) {
        alert('Missing required data: loan amount and disbursement date are required.');
        return;
      }
      
      const installmentAmount = loan.installment_amount || (loan.loan_amount / 14);
      const disbursementDate = new Date(loan.date_of_disbursement);
      const installments = [];
      
      // Generate 14 installments with 7-day intervals
      for (let i = 1; i <= 14; i++) {
        const dueDate = new Date(disbursementDate);
        dueDate.setDate(dueDate.getDate() + (i * 7)); // 7 days interval
        
        installments.push({
          loan_id: loanId,
          installment_number: i,
          amount: installmentAmount,
          due_date: dueDate.toISOString().split('T')[0],
          status: 'Pending'
        });
      }
      
      await api.post('/installments/bulk-create', { installments });
      alert('14 installments generated successfully!');
    } catch (error) {
      console.error('Error generating installments:', error);
      alert('Error generating installments: ' + (error.response?.data?.error || error.message));
    }
  };

  const markAsClosed = async (loan) => {
    try {
      if (!window.confirm('Mark this loan as Closed?')) return;
      await api.put(`/loans/${loan.loan_id}`, {
        branch: loan.branch || '',
        sourced_by: loan.sourced_by || '',
        customer_name: loan.customer_name || '',
        loan_amount: loan.loan_amount || 0,
        processing_fee: (loan.processing_fee ?? loan.pf) || 0,
        gst: loan.gst || 0,
        net_disbursement: loan.net_disbursement || 0,
        repayment_amount: loan.repayment_amount || 0,
        interest_earned: loan.interest_earned || 0,
        roi: loan.roi || 0,
        tenure_days: loan.tenure_days || 0,
        date_of_disbursement: loan.date_of_disbursement || null,
        installment_amount: loan.installment_amount || 0,
        total_installments: loan.total_installments || loan.no_of_installment || 0,
        status: 'Closed'
      });
      alert('Loan marked as Closed');
      fetchLoans();
    } catch (error) {
      console.error('Error marking loan closed:', error);
      alert('Error marking loan closed: ' + (error.response?.data?.error || error.message));
    }
  };

  const issueNOC = async (loan, note = '') => {
    try {
      const res = await api.post(`/loans/${loan.loan_id}/noc`, { note });
      setNocData({ loan, noc: res.data });
      setNocVisible(true);
    } catch (error) {
      alert('Failed to issue NOC: ' + (error.response?.data?.error || error.message));
    }
  };

  const viewNOC = async (loan) => {
    try {
      const res = await api.get(`/loans/${loan.loan_id}/noc`);
      setNocData({ loan, noc: res.data });
      setNocVisible(true);
    } catch (error) {
      if (error.response?.status === 404) {
        alert('NOC not issued for this loan yet');
      } else {
        alert('Failed to fetch NOC: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const printNOC = () => {
    window.print();
  };

  const generateAllInstallments = async () => {
    setLoading(true);
    let successCount = 0;
    let errorCount = 0;
    
    try {
      const eligibleLoans = loans.filter(loan => 
        loan.loan_amount && loan.date_of_disbursement
      );
      
      if (eligibleLoans.length === 0) {
        alert('No eligible loans found. Loans must have amount and disbursement date.');
        return;
      }
      
      const allInstallments = [];
      
      for (const loan of eligibleLoans) {
        try {
          const installmentAmount = loan.installment_amount || (loan.loan_amount / 14);
          const disbursementDate = new Date(loan.date_of_disbursement);
          
          // Generate 14 installments with 7-day intervals
          for (let i = 1; i <= 14; i++) {
            const dueDate = new Date(disbursementDate);
            dueDate.setDate(dueDate.getDate() + (i * 7));
            
            allInstallments.push({
              loan_id: loan.loan_id,
              installment_number: i,
              amount: installmentAmount,
              due_date: dueDate.toISOString().split('T')[0],
              status: 'Pending'
            });
          }
          successCount++;
        } catch (error) {
          console.error(`Error processing loan ${loan.loan_id}:`, error);
          errorCount++;
        }
      }
      
      if (allInstallments.length > 0) {
        await api.post('/installments/bulk-create', { installments: allInstallments });
      }
      
      alert(`Generated ${allInstallments.length} installments for ${successCount} loans!\nErrors: ${errorCount}`);
      
    } catch (error) {
      console.error('Error in bulk installment generation:', error);
      alert('Error generating installments: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCSVImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csv = e.target.result;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        const loans = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(',').map(v => v.trim());
          if (values.length < headers.length) continue;
          
          const loan = {
            loan_id: values[0] || '',
            branch: values[1] || '',
            sourced_by: values[2] || '',
            customer_name: values[3] || '',
            loan_amount: parseFloat(values[4]) || 0,
            processing_fee: parseFloat(values[5]) || 0,
            gst: parseFloat(values[6]) || 0,
            net_disbursement: parseFloat(values[7]) || 0,
            repayment_amount: parseFloat(values[8]) || 0,
            interest_earned: parseFloat(values[9]) || 0,
            date_of_disbursement: formatDate(values[10]) || '',
            total_installments: parseInt(values[11]) || 0,
            installment_amount: parseFloat(values[12]) || 0
          };
          
          loans.push(loan);
        }
        
        setLoading(true);
        
        try {
          const response = await api.post('/loans/bulk-import', { loans });
          alert(`Import completed! ${response.data.imported} loans imported successfully. ${response.data.errors} errors.`);
          fetchLoans();
        } catch (error) {
          console.error('Bulk import error:', error);
          alert('Error during bulk import: ' + (error.response?.data?.error || error.message));
        }
        
      } catch (error) {
        alert('Error reading CSV file: ' + error.message);
      } finally {
        setLoading(false);
        event.target.value = '';
      }
    };
    
    reader.readAsText(file);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    
    // Handle DD/MM/YYYY format
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
    }
    
    return dateStr;
  };

  const fetchMonthlyData = async () => {
    try {
      const response = await api.get('/loans/monthly-disbursement');
      setMonthlyData(response.data || []);
    } catch (error) {
      console.error('Error fetching monthly data:', error);
    }
  };

  const fetchCollectionDemand = async () => {
    try {
      const response = await api.get('/installments/monthly-demand');
      setCollectionDemand(response.data || []);
    } catch (error) {
      console.error('Error fetching collection demand:', error);
      setCollectionDemand([]);
    }
  };

  const fetchRealCollectionData = async () => {
    try {
      const response = await api.get('/collections/monthly');
      setRealCollectionData(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching real collection data:', error);
    }
  };

  const branchOptions = Array.from(new Set((loans || []).map(l => l.branch).filter(Boolean)));
  const productOptions = Array.from(new Set((loans || []).map(l => (l.product || l.type || l.product_type || '').trim()).filter(Boolean)));

  const filteredLoans = (() => {
    const term = (searchTerm || '').toLowerCase();
    const from = filterFrom ? new Date(filterFrom) : null;
    const to = filterTo ? new Date(filterTo) : null;
    const prod = (filterProduct || 'All').toLowerCase();
    const list = (loans || []).filter(l => {
      const matchSearch = !term || (l.customer_name || '').toLowerCase().includes(term) || (l.loan_id || '').toLowerCase().includes(term);
      const matchBranch = filterBranch === 'All' || (l.branch || '') === filterBranch;
      const disb = l.date_of_disbursement ? new Date(l.date_of_disbursement) : null;
      const matchFrom = !from || (disb && disb >= from);
      const matchTo = !to || (disb && disb <= to);
      const pval = (l.product || l.type || l.product_type || '').toLowerCase();
      const matchProduct = filterProduct === 'All' || (pval && pval === prod);
      return matchSearch && matchBranch && matchFrom && matchTo && matchProduct;
    });
    // Sorting
    const sorted = [...list].sort((a, b) => {
      const ad = a.date_of_disbursement || '';
      const bd = b.date_of_disbursement || '';
      const aDate = ad ? new Date(ad) : new Date(0);
      const bDate = bd ? new Date(bd) : new Date(0);
      switch (sortBy) {
        case 'date_asc':
          return aDate - bDate;
        case 'date_desc':
          return bDate - aDate;
        case 'branch_asc':
          return (a.branch || '').localeCompare(b.branch || '');
        case 'branch_desc':
          return (b.branch || '').localeCompare(a.branch || '');
        case 'amount_asc':
          return (a.loan_amount || 0) - (b.loan_amount || 0);
        case 'amount_desc':
          return (b.loan_amount || 0) - (a.loan_amount || 0);
        default:
          return bDate - aDate;
      }
    });
    return sorted;
  })();

  const tabs = [
    { id: 'all', label: 'All Loans' },
    { id: 'closed', label: 'Closed Cases' },
    { id: 'monthly', label: 'Monthly Disbursement' },
    { id: 'demand', label: 'Collection Demand' }
  ];

  return (
    <div>
      <div className="page-header">
        <h2>Loan Management</h2>
        <div className="header-actions">
          <button 
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary"
          >
            {showForm ? 'Cancel' : 'Add New Loan'}
          </button>
          <input
            type="file"
            accept=".csv"
            onChange={handleCSVImport}
            style={{ display: 'none' }}
            ref={fileInputRef}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-success"
            style={{ marginLeft: '10px' }}
            disabled={loading}
          >
            {loading ? t('importing') : t('importCSV')}
          </button>
          <button
            onClick={generateAllInstallments}
            className="btn btn-warning"
            style={{ marginLeft: '10px' }}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate All EMI'}
          </button>
        </div>
      </div>

      <div className="tab-navigation">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'all' && (
        <div className="search-bar">
          <div className="form-row">
            <div className="form-group">
              <label>Search</label>
              <input
                type="text"
                placeholder="Search by customer name or loan ID..."
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
              <label>Product</label>
              <select className="form-control" value={filterProduct} onChange={(e)=>setFilterProduct(e.target.value)}>
                <option>All</option>
                {productOptions.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Sort By</label>
              <select className="form-control" value={sortBy} onChange={(e)=>setSortBy(e.target.value)}>
                <option value="date_desc">Date (Newest)</option>
                <option value="date_asc">Date (Oldest)</option>
                <option value="branch_asc">Branch (A-Z)</option>
                <option value="branch_desc">Branch (Z-A)</option>
                <option value="amount_desc">Amount (High-Low)</option>
                <option value="amount_asc">Amount (Low-High)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="card form-card">
          <h3>{editingLoan ? 'Edit Loan' : 'Add New Loan'}</h3>
          <form onSubmit={handleSubmit} className="loan-form">
            <div className="form-row">
              <div className="form-group">
                <label>Loan ID</label>
                <input
                  type="text"
                  value={formData.loan_id}
                  onChange={(e) => setFormData({...formData, loan_id: e.target.value})}
                  className="form-control"
                  required
                  disabled={editingLoan}
                />
              </div>
              <div className="form-group">
                <label>Branch</label>
                <input
                  type="text"
                  value={formData.branch}
                  onChange={(e) => setFormData({...formData, branch: e.target.value})}
                  className="form-control"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{t('sourcedBy')}</label>
                <input
                  type="text"
                  value={formData.sourced_by}
                  onChange={(e) => setFormData({...formData, sourced_by: e.target.value})}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Customer Name</label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                  className="form-control"
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Loan Amount</label>
                <input
                  type="number"
                  value={formData.loan_amount}
                  onChange={(e) => setFormData({...formData, loan_amount: e.target.value})}
                  className="form-control"
                  required
                />
              </div>
              <div className="form-group">
                <label>Processing Fee</label>
                <input
                  type="number"
                  value={formData.processing_fee}
                  onChange={(e) => setFormData({...formData, processing_fee: e.target.value})}
                  className="form-control"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>GST</label>
                <input
                  type="number"
                  value={formData.gst}
                  onChange={(e) => setFormData({...formData, gst: e.target.value})}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Net Disbursement</label>
                <input
                  type="number"
                  value={formData.net_disbursement}
                  onChange={(e) => setFormData({...formData, net_disbursement: e.target.value})}
                  className="form-control"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{t('repaymentAmount')}</label>
                <input
                  type="number"
                  value={formData.repayment_amount}
                  onChange={(e) => setFormData({...formData, repayment_amount: e.target.value})}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Interest Earned</label>
                <input
                  type="number"
                  value={formData.interest_earned}
                  onChange={(e) => setFormData({...formData, interest_earned: e.target.value})}
                  className="form-control"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>ROI (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.roi}
                  onChange={(e) => setFormData({...formData, roi: e.target.value})}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Tenure (Days)</label>
                <input
                  type="number"
                  value={formData.tenure_days}
                  onChange={(e) => setFormData({...formData, tenure_days: e.target.value})}
                  className="form-control"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Date of Disbursement</label>
                <input
                  type="date"
                  value={formData.date_of_disbursement}
                  onChange={(e) => setFormData({...formData, date_of_disbursement: e.target.value})}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Installment Amount</label>
                <input
                  type="number"
                  value={formData.installment_amount}
                  onChange={(e) => setFormData({...formData, installment_amount: e.target.value})}
                  className="form-control"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Total Installments</label>
                <input
                  type="number"
                  value={formData.total_installments}
                  onChange={(e) => setFormData({...formData, total_installments: e.target.value})}
                  className="form-control"
                />
              </div>
            </div>
            <div className="form-actions">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-success"
              >
                {loading ? 'Saving...' : (editingLoan ? 'Update Loan' : 'Create Loan')}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'all' && (
        <>
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-header">
              <h3>Disbursement Summary</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', gap: '30px' }}>
                <div>
                  <h4 style={{ margin: 0, color: '#007bff' }}>{loans.length}</h4>
                  <p style={{ margin: 0, fontSize: '14px' }}>Total Cases Disbursed</p>
                </div>
                <div>
                  <h4 style={{ margin: 0, color: '#28a745' }}>₹{loans.reduce((sum, loan) => sum + (loan.loan_amount || 0), 0).toLocaleString()}</h4>
                  <p style={{ margin: 0, fontSize: '14px' }}>Total Amount Disbursed</p>
                </div>
                <div>
                  <h4 style={{ margin: 0, color: '#ffc107' }}>₹{loans.reduce((sum, loan) => sum + (loan.net_disbursement || 0), 0).toLocaleString()}</h4>
                  <p style={{ margin: 0, fontSize: '14px' }}>Net Disbursement</p>
                </div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h3>All Loans ({filteredLoans.length})</h3>
            </div>
            <table className="table">
            <thead>
              <tr>
                <th>ID</th><th>Branch</th><th>Customer</th><th>Amount</th><th>PF</th><th>GST</th><th>Net</th><th>ROI</th><th>Tenure</th><th>Disbursed</th><th>Installments</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLoans.map(l => (
                <tr key={l.loan_id}>
                  <td><span style={{ color: '#007bff', textDecoration: 'underline', cursor: 'pointer' }} onClick={() => navigate(`/loans/${l.loan_id}/details`)}>{l.loan_id || 'N/A'}</span></td>
                  <td>{l.branch || 'N/A'}</td>
                  <td>{l.customer_name || 'N/A'}</td>
                  <td>₹{(l.loan_amount || 0).toLocaleString()}</td>
                  <td>₹{l.processing_fee || l.pf || 0}</td>
                  <td>₹{l.gst || 0}</td>
                  <td>₹{(l.net_disbursement || 0).toLocaleString()}</td>
                  <td>{l.roi || 0}%</td>
                  <td>{l.tenure_days || 0}d</td>
                  <td>{formatCSVDate(l.date_of_disbursement) || 'N/A'}</td>
                  <td>{l.total_installments || l.no_of_installment || 0}</td>
                  <td>
                    <button
                      onClick={() => handleEdit(l)}
                      className="btn btn-sm btn-primary"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => generateInstallments(l.loan_id)}
                      className="btn btn-sm btn-success"
                    >
                      Generate EMI
                    </button>
                    {String(l.status || '').toLowerCase() !== 'closed' && (
                      <button
                        onClick={() => markAsClosed(l)}
                        className="btn btn-sm btn-secondary"
                      >
                        Mark Closed
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      {activeTab === 'monthly' && (
        <div className="card">
          <div className="card-header">
            <h3>Monthly Disbursement Summary</h3>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Month</th><th>Total Loans</th><th>Total Amount</th><th>Avg Amount</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((month, index) => (
                <tr key={index}>
                  <td>{month.month}</td>
                  <td>{month.total_loans}</td>
                  <td>₹{(month.total_amount || 0).toLocaleString()}</td>
                  <td>₹{(month.avg_amount || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'closed' && (
        <div className="card">
          <div className="card-header">
            <h3>Closed Cases</h3>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th><th>Customer</th><th>Amount</th><th>Net</th><th>Disbursed</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loans.filter(l => String(l.status || '').toLowerCase() === 'closed').map(l => (
                <tr key={l.loan_id}>
                  <td><span style={{ color: '#007bff', textDecoration: 'underline', cursor: 'pointer' }} onClick={() => navigate(`/loans/${l.loan_id}/details`)}>{l.loan_id || 'N/A'}</span></td>
                  <td>{l.customer_name || 'N/A'}</td>
                  <td>₹{(l.loan_amount || 0).toLocaleString()}</td>
                  <td>₹{(l.net_disbursement || 0).toLocaleString()}</td>
                  <td>{formatCSVDate(l.date_of_disbursement) || 'N/A'}</td>
                  <td>{l.status || 'Closed'}</td>
                  <td>
                    <button className="btn btn-sm btn-success" onClick={() => issueNOC(l)}>Issue NOC</button>
                    <button className="btn btn-sm btn-primary" onClick={() => viewNOC(l)} style={{ marginLeft: 8 }}>View NOC</button>
                  </td>
                </tr>
              ))}
              {loans.filter(l => String(l.status || '').toLowerCase() === 'closed').length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: 'center', color: '#888' }}>No closed cases found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {nocVisible && nocData && (
        <div className="card">
          <div className="card-header">
            <h3>No Objection Certificate (NOC)</h3>
          </div>
          <div className="card-body">
            <p><strong>Reference No:</strong> {nocData.noc.reference_no}</p>
            <p><strong>Loan ID:</strong> {nocData.loan.loan_id}</p>
            <p><strong>Borrower:</strong> {nocData.noc.borrower_name || nocData.loan.customer_name}</p>
            <p><strong>Issued By:</strong> {nocData.noc.issued_by}</p>
            <p><strong>Issued At:</strong> {formatCSVDate(nocData.noc.issued_at)}</p>
            {nocData.noc.note && (<p><strong>Note:</strong> {nocData.noc.note}</p>)}
            <div style={{ border: '1px solid #ccc', padding: '12px', marginTop: '12px' }}>
              <p>
                This is to certify that the borrower named above has closed the loan account {nocData.loan.loan_id} in full, and
                there are no outstanding dues as of the date of issuance. This NOC is issued upon request of the borrower for their records.
              </p>
            </div>
            <div className="form-actions" style={{ marginTop: 12 }}>
              <button className="btn btn-secondary" onClick={() => setNocVisible(false)}>Close</button>
              <button className="btn btn-primary" onClick={printNOC} style={{ marginLeft: 8 }}>Print NOC</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'demand' && (
        <div className="card">
          <div className="card-header">
            <h3>Monthly Collection Demand</h3>
          </div>
          {(() => {
            const rows = (realCollectionData.length > 0 ? realCollectionData : collectionDemand);
            if (!rows || rows.length === 0) {
              return (
                <div className="card-body">
                  <p style={{ marginBottom: 12 }}>No collection demand data found. This typically means installments have not been generated yet.</p>
                  <button className="btn btn-warning" disabled={loading} onClick={generateAllInstallments}>
                    {loading ? 'Generating...' : 'Generate EMIs for All Loans'}
                  </button>
                </div>
              );
            }
            return (
              <table className="table">
                <thead>
                  <tr>
                    <th>Month</th><th>Total EMIs</th><th>Unique Loans</th><th>Demand Amount</th><th>Collected</th><th>Pending</th><th>Collection %</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((month, index) => (
                    <tr key={index}>
                      <td>{month.month_name || month.month}</td>
                      <td>{month.total_emis || 0}</td>
                      <td>{month.unique_loans || 0}</td>
                      <td>₹{(month.total_demand || 0).toLocaleString()}</td>
                      <td>₹{(month.collected || 0).toLocaleString()}</td>
                      <td>₹{(month.pending || 0).toLocaleString()}</td>
                      <td style={{ color: (month.collection_percentage || 0) >= 70 ? '#28a745' : (month.collection_percentage || 0) >= 50 ? '#ffc107' : '#dc3545' }}>
                        {(month.collection_percentage || 0).toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })()}
        </div>
      )}
    </div>
  );
}