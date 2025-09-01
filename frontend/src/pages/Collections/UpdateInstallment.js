import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Papa from 'papaparse';

// Reusable API client with auth header
const api = axios.create({ baseURL: 'http://localhost:4000/api' });
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function UpdateInstallment() {
  // Loans (cases) listing + search
  const [loans, setLoans] = useState([]);
  const [loansLoading, setLoansLoading] = useState(false);
  const [loansError, setLoansError] = useState('');
  const [search, setSearch] = useState('');

  // Selected loan + installments editing
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [rows, setRows] = useState([]); // editable copy of installments
  const [original, setOriginal] = useState([]); // reference for change detection
  const [loadingRows, setLoadingRows] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // CSV upload functionality
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [csvProcessing, setCsvProcessing] = useState(false);
  const [csvUploadSuccess, setCsvUploadSuccess] = useState(false);
  const [csvUploadError, setCsvUploadError] = useState('');

  // Load all loans (cases)
  const fetchLoans = async () => {
    setLoansLoading(true);
    setLoansError('');
    try {
      const res = await api.get('/loans');
      setLoans(res.data || []);
    } catch (e) {
      console.error('Failed to load loans', e);
      setLoans([]);
      setLoansError(e.response?.data?.error || e.message || 'Failed to load loans');
    } finally {
      setLoansLoading(false);
    }
  };

  useEffect(() => { fetchLoans(); }, []);

  const filteredLoans = useMemo(() => {
    const q = (search || '').trim().toLowerCase();
    if (!q) return loans;
    return loans.filter(l =>
      String(l.loan_id || '').toLowerCase().includes(q) ||
      String(l.customer_name || '').toLowerCase().includes(q) ||
      String(l.branch || '').toLowerCase().includes(q) ||
      String(l.sourced_by || '').toLowerCase().includes(q)
    );
  }, [loans, search]);

  // Load installments for a loan
  const loadByLoan = async (loan) => {
    if (!loan?.loan_id) return;
    setSelectedLoan(loan);
    setLoadingRows(true);
    try {
      const res = await api.get(`/installments/by-loan/${encodeURIComponent(loan.loan_id)}`);
      const data = (res.data || []).map(r => ({
        ...r,
        due_date: r.due_date ? String(r.due_date).slice(0, 10) : ''
      }));
      setRows(data);
      setOriginal(JSON.parse(JSON.stringify(data)));
    } catch (e) {
      console.error('Failed to load installments', e);
      setRows([]);
      setOriginal([]);
      alert(e.response?.data?.error || e.message || 'Failed to load installments');
    } finally {
      setLoadingRows(false);
    }
  };

  const markChanged = (id, field, value) => {
    setRows(prev => prev.map(r => r.installment_id === id ? { ...r, [field]: value } : r));
  };

  const getChangedFields = (row) => {
    const base = original.find(o => o.installment_id === row.installment_id) || {};
    const changed = {};
    if (row.due_date !== base.due_date) changed.due_date = row.due_date || null;
    const amtNow = Number(row.amount);
    const amtBase = Number(base.amount);
    if (!Number.isNaN(amtNow) && amtNow !== amtBase) changed.amount = amtNow;
    if ((row.status || '') !== (base.status || '')) changed.status = row.status || null;
    return changed;
  };

  const saveOne = async (row) => {
    const changed = getChangedFields(row);
    if (Object.keys(changed).length === 0) { alert('No changes to save for this row'); return; }
    try {
      await api.put(`/installments/${row.installment_id}`, changed);
      // reflect in originals so subsequent edits compare correctly
      setOriginal(prev => prev.map(o => o.installment_id === row.installment_id ? { ...o, ...changed } : o));
      alert(`Installment #${row.installment_number} updated`);
    } catch (e) {
      console.error('Save failed', e);
      alert('Failed to update installment: ' + (e.response?.data?.error || e.message));
    }
  };

  const saveAll = async () => {
    const dirty = rows.filter(r => Object.keys(getChangedFields(r)).length > 0);
    if (!dirty.length) { alert('No changes to save'); return; }
    setSaving(true);
    let ok = 0, fail = 0;
    for (const r of dirty) {
      const changed = getChangedFields(r);
      try {
        await api.put(`/installments/${r.installment_id}`, changed);
        ok++;
      } catch (e) {
        console.error('Bulk save row failed', r.installment_id, e);
        fail++;
      }
    }
    setSaving(false);
    if (ok) {
      // refresh originals
      setOriginal(JSON.parse(JSON.stringify(rows)));
    }
    alert(`Saved: ${ok}, Failed: ${fail}`);
  };

  const clearSelection = () => {
    setSelectedLoan(null);
    setRows([]);
    setOriginal([]);
  };

  const renderStatusBadge = (s) => {
    const cls = s === 'Paid' ? 'status-paid' : s === 'Overdue' ? 'status-overdue' : s === 'Default' ? 'status-critical' : 'status-pending';
    return <span className={`status-badge ${cls}`}>{s || 'Pending'}</span>;
  };

  const handleSearchKey = (e) => {
    if (e.key === 'Enter') {
      if (filteredLoans.length > 0) {
        loadByLoan(filteredLoans[0]);
      } else if (search.trim()) {
        // fallback: attempt direct lookup by id string
        const loan = loans.find(l => String(l.loan_id || '').toLowerCase() === search.trim().toLowerCase());
        if (loan) loadByLoan(loan);
      }
    }
  };

  // CSV file handling
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setCsvFile(file);
    setCsvUploadError('');
    setCsvUploadSuccess(false);
    
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        // Validate CSV data
        const errors = [];
        const validData = [];
        
        results.data.forEach((row, index) => {
          const loanId = row['LOAN ID'] || row['loan_id'] || '';
          const installmentNo = row['INSTALLMENT NO'] || row['installment_no'] || row['installment number'] || '';
          const utr = row['INSTALLMENT UTR'] || row['utr'] || '';
          
          if (!loanId || !installmentNo) {
            errors.push(`Row ${index + 1}: Missing Loan ID or Installment Number`);
          } else {
            validData.push({
              loan_id: loanId,
              installment_number: parseInt(installmentNo),
              utr: utr
            });
          }
        });
        
        if (errors.length > 0) {
          setCsvUploadError(`CSV validation errors: ${errors.join('; ')}`);
          return;
        }
        
        if (validData.length === 0) {
          setCsvUploadError('No valid data found in CSV');
          return;
        }
        
        setCsvData(validData);
      },
      error: (error) => {
        setCsvUploadError(`Error parsing CSV: ${error.message}`);
      }
    });
  };

  const processCsvUpload = async () => {
    if (csvData.length === 0) {
      setCsvUploadError('No data to process');
      return;
    }
    
    setCsvProcessing(true);
    setCsvUploadError('');
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // Process each row in the CSV data
    for (const row of csvData) {
      try {
        // Find the installment
        const installments = await api.get(`/installments/by-loan/${encodeURIComponent(row.loan_id)}`);
        const installment = installments.find(inst => inst.installment_number === row.installment_number) || null;
        
        if (!installment) {
          errorCount++;
          errors.push(`Loan ID: ${row.loan_id}, Installment: ${row.installment_number} - Installment not found`);
          continue;
        }
        
        // Record payment with UTR
        await api.post('/api/payments/record', {
          installment_id: installment.installment_id,
          amount: installment.amount, // Use the actual installment amount
          method: 'Bank Transfer',
          remarks: 'Updated via CSV upload',
          utr: row.utr,
          received_date: new Date().toISOString().split('T')[0]
        });
        
        successCount++;
      } catch (error) {
        errorCount++;
        errors.push(`Loan ID: ${row.loan_id}, Installment: ${row.installment_number} - ${error.message || error.response?.data?.error || 'Unknown error'}`);
      }
    }
    
    setCsvProcessing(false);
    
    if (errorCount === 0) {
      setCsvUploadSuccess(true);
      setCsvUploadError(`Successfully processed ${successCount} records`);
    } else {
      setCsvUploadError(`Processed ${successCount} records with ${errorCount} errors. Details: ${errors.slice(0, 5).join('; ')}${errors.length > 5 ? '...' : ''}`);
    }
  };

  const resetCsvUpload = () => {
    setCsvFile(null);
    setCsvData([]);
    setCsvUploadSuccess(false);
    setCsvUploadError('');
  };

  const fmtINR = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(Number(n || 0));
  const fmtDate = (d) => d ? String(d).slice(0,10) : '';

  return (
    <div>
      <div className="page-header">
        <h2>Update Installment</h2>
        <div className="header-actions">
          <input
            className="form-control"
            placeholder="Search loans: Loan ID, Customer, Branch, Sourced by"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKey}
            style={{ width: 360, display: 'inline-block' }}
          />
          <button className="btn btn-primary" onClick={fetchLoans} disabled={loansLoading}>
            {loansLoading ? 'Loading...' : 'Refresh'}
          </button>
          <button className="btn btn-secondary" onClick={() => setSearch('')}>
            Clear Search
          </button>
        </div>
      </div>

      {/* Loans list (cases) */}
      <div className="card">
        <div className="card-header">
          <h3>All Cases (Loans) {filteredLoans.length !== loans.length ? `- ${filteredLoans.length} of ${loans.length}` : `(${loans.length})`}</h3>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Loan ID</th>
              <th>Customer</th>
              <th>Branch</th>
              <th>Disbursed</th>
              <th>EMI</th>
              <th>Installments</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loansLoading && (
              <tr><td colSpan="8">Loading loans...</td></tr>
            )}
            {!loansLoading && filteredLoans.length === 0 && (
              <tr><td colSpan="8" style={{ color: '#666' }}>No loans found. Adjust search query.</td></tr>
            )}
            {!loansLoading && filteredLoans.map((l) => (
              <tr key={l.loan_id} style={{ background: selectedLoan?.loan_id === l.loan_id ? 'rgba(102,126,234,0.06)' : undefined }}>
                <td>{l.loan_id}</td>
                <td>{l.customer_name}</td>
                <td>{l.branch || '-'}</td>
                <td>{fmtDate(l.date_of_disbursement)}</td>
                <td>{fmtINR(l.installment_amount || 0)}</td>
                <td>{l.total_installments || l.no_of_installment || 0}</td>
                <td>{l.status || 'Active'}</td>
                <td>
                  <button className="btn btn-sm btn-success" onClick={() => loadByLoan(l)}>Open</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Installments editor for selected loan */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3>
            {selectedLoan ? `Installments for ${selectedLoan.loan_id} - ${selectedLoan.customer_name}` : 'Installments'}
          </h3>
          <div className="header-actions">
            <button className="btn btn-success" onClick={saveAll} disabled={saving || rows.length === 0}>
              {saving ? 'Saving...' : 'Save All Changes'}
            </button>
            <button className="btn btn-secondary" onClick={clearSelection} disabled={!selectedLoan}>Clear</button>
          </div>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Due Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Current</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loadingRows && (
              <tr><td colSpan="6">Loading installments...</td></tr>
            )}
            {!loadingRows && rows.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: '#666' }}>
                  Select a loan from the list above to view and edit its installments
                </td>
              </tr>
            )}
            {!loadingRows && rows.map((r) => {
              const changed = getChangedFields(r);
              const hasChanges = Object.keys(changed).length > 0;
              return (
                <tr key={r.installment_id}>
                  <td>EMI {r.installment_number}</td>
                  <td>
                    <input
                      type="date"
                      className="form-control"
                      value={r.due_date || ''}
                      onChange={(e) => markChanged(r.installment_id, 'due_date', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="form-control"
                      value={r.amount}
                      onChange={(e) => markChanged(r.installment_id, 'amount', e.target.value)}
                      min={0}
                    />
                  </td>
                  <td>
                    <select
                      className="form-control"
                      value={r.status || 'Pending'}
                      onChange={(e) => markChanged(r.installment_id, 'status', e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Overdue">Overdue</option>
                      <option value="Default">Default</option>
                    </select>
                  </td>
                  <td>{renderStatusBadge(original.find(o => o.installment_id === r.installment_id)?.status)}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-success"
                      disabled={!hasChanges || saving}
                      onClick={() => saveOne(r)}
                    >
                      Save
                    </button>
                    <button
                      className="btn btn-sm btn-light"
                      style={{ marginLeft: 6 }}
                      onClick={() => {
                        const base = original.find(o => o.installment_id === r.installment_id);
                        if (!base) return;
                        markChanged(r.installment_id, 'due_date', base.due_date);
                        markChanged(r.installment_id, 'amount', base.amount);
                        markChanged(r.installment_id, 'status', base.status);
                      }}
                    >
                      Reset
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* CSV Upload Section */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <h3>CSV Upload for Installment UTR Updates</h3>
        </div>
        <div className="card-body">
          <div className="upload-section">
            <p>Upload a CSV file to update installment UTR information. The CSV should contain the following columns:</p>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li><strong>LOAN ID</strong> - The loan identifier</li>
              <li><strong>INSTALLMENT NO</strong> - The installment number</li>
              <li><strong>INSTALLMENT UTR</strong> - The UTR number for the installment payment</li>
            </ul>
            
            <div className="file-upload" style={{ marginTop: 15 }}>
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleFileUpload}
                style={{ display: 'none' }} 
                id="csv-upload" 
              />
              <label 
                htmlFor="csv-upload" 
                className="btn btn-primary"
                style={{ marginRight: 10 }}
              >
                {csvFile ? 'Change File' : 'Choose CSV File'}
              </label>
              
              {csvFile && (
                <button 
                  className="btn btn-success" 
                  onClick={processCsvUpload}
                  disabled={csvProcessing}
                >
                  {csvProcessing ? 'Processing...' : 'Upload UTR Data'}
                </button>
              )}
              
              {csvFile && (
                <button 
                  className="btn btn-secondary" 
                  onClick={resetCsvUpload}
                >
                  Reset
                </button>
              )}
            </div>
            
            {csvUploadError && (
              <div className="alert alert-danger" style={{ marginTop: 15 }}>
                {csvUploadError}
              </div>
            )}
            
            {csvUploadSuccess && (
              <div className="alert alert-success" style={{ marginTop: 15 }}>
                {csvUploadError}
              </div>
            )}
            
            {csvData.length > 0 && (
              <div style={{ marginTop: 15 }}>
                <h4>Preview ({csvData.length} records)</h4>
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px' }}>
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Loan ID</th>
                        <th>Installment No</th>
                        <th>UTR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.slice(0, 5).map((row, index) => (
                        <tr key={index}>
                          <td>{row.loan_id}</td>
                          <td>{row.installment_number}</td>
                          <td>{row.utr || 'N/A'}</td>
                        </tr>
                      ))}
                      {csvData.length > 5 && (
                        <tr>
                          <td colSpan={3} style={{ textAlign: 'center' }}>
                            ...and {csvData.length - 5} more records
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <h3>Notes</h3>
        </div>
        <div className="card-body">
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>Use the top search to filter cases by Loan ID, Customer, Branch, or Sourced By.</li>
            <li>Select a case and update Due Date, Amount, and Status. Save individual rows or Save All Changes.</li>
            <li>For recording payments, use Update Collection or Daily Collection tabs.</li>
            <li>Use the CSV upload feature to bulk update installment UTR numbers.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
