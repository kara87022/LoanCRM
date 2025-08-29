import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import '../App.css';
import { formatCSVDate } from '../utils/date';

const api = axios.create({ baseURL: 'http://localhost:4000/api' });
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function ClosedLoans() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [nocVisible, setNocVisible] = useState(false);
  const [nocData, setNocData] = useState(null); // { loan, noc }
  // Bulk close state
  const [bulkIdsText, setBulkIdsText] = useState('');
  const [bulkCsvUploading, setBulkCsvUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  useEffect(() => { fetchLoans(); }, []);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const res = await api.get('/loans');
      setLoans(res.data || []);
    } catch (e) {
      console.error('Load closed loans error:', e);
      alert('Failed to load loans. Make sure backend is running and you are logged in.');
    } finally {
      setLoading(false);
    }
  };

  const closedLoans = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (loans || [])
      .filter(l => String(l.status || '').toLowerCase() === 'closed')
      .filter(l => !q || (l.loan_id || '').toLowerCase().includes(q) || (l.customer_name || '').toLowerCase().includes(q) || (l.branch || '').toLowerCase().includes(q));
  }, [loans, search]);

  const totalNetClosed = useMemo(() => closedLoans.reduce((s, l) => s + (l.net_disbursement || 0), 0), [closedLoans]);
  const totalAmountClosed = useMemo(() => closedLoans.reduce((s, l) => s + (l.loan_amount || 0), 0), [closedLoans]);

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

  const reopenLoan = async (loan) => {
    try {
      if (!window.confirm('Reopen this loan (set status to Active)?')) return;
      await api.put(`/loans/${loan.loan_id}`, {
        branch: loan.branch || '',
        sourced_by: loan.sourced_by || '',
        customer_name: loan.customer_name || '',
        loan_amount: loan.loan_amount || 0,
        processing_fee: loan.processing_fee ?? loan.pf ?? 0,
        gst: loan.gst || 0,
        net_disbursement: loan.net_disbursement || 0,
        repayment_amount: loan.repayment_amount || 0,
        interest_earned: loan.interest_earned || 0,
        roi: loan.roi || 0,
        tenure_days: loan.tenure_days || 0,
        date_of_disbursement: loan.date_of_disbursement || null,
        installment_amount: loan.installment_amount || 0,
        total_installments: loan.total_installments || loan.no_of_installment || 0,
        status: 'Active'
      });
      await fetchLoans();
      alert('Loan reopened successfully');
    } catch (error) {
      alert('Failed to reopen: ' + (error.response?.data?.error || error.message));
    }
  };

  const printNOC = () => { window.print(); };

  return (
    <div>
      <div className="page-header">
        <h2>Closed Loans</h2>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={fetchLoans} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <h3>{closedLoans.length}</h3>
          <p>Closed Cases</p>
        </div>
        <div className="stat-card">
          <h3>₹{totalAmountClosed.toLocaleString()}</h3>
          <p>Total Amount</p>
        </div>
        <div className="stat-card">
          <h3>₹{totalNetClosed.toLocaleString()}</h3>
          <p>Total Net Disbursed</p>
        </div>
      </div>

      <div className="search-bar">
        <input
          type="text"
          className="form-control"
          placeholder="Search by Loan ID / Customer / Branch"
          value={search}
          onChange={(e)=>setSearch(e.target.value)}
        />
      </div>

      <div className="card form-card">
        <div className="card-header"><h3>Bulk Close Cases</h3></div>
        <div className="card-body">
          <div className="form-row">
            <div className="form-group">
              <label>Paste Loan IDs (one per line)</label>
              <textarea className="form-control" style={{ minHeight: 100 }} placeholder="BL000001\nBL000002\n..." value={bulkIdsText} onChange={(e)=>setBulkIdsText(e.target.value)} />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-success" onClick={async ()=>{
              const ids = bulkIdsText.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
              if (ids.length === 0) { alert('No loan IDs provided'); return; }
              setLoading(true);
              try {
                const res = await api.post('/loans/bulk-close', { loan_ids: ids });
                setBulkResult(res.data);
                await fetchLoans();
                alert(`Closed: ${res.data.closed} / ${res.data.total}`);
              } catch (e) {
                alert('Bulk close failed: ' + (e.response?.data?.error || e.message));
              } finally {
                setLoading(false);
              }
            }}>Close Listed Loans</button>
          </div>
          <div className="form-row" style={{ marginTop: 12 }}>
            <div className="form-group">
              <label>Or Upload CSV (LOAN ID, AMOUNT RECEIVED)</label>
              <input type="file" className="form-control" accept=".csv,.xlsx" onChange={async (e)=>{
                const file = e.target.files?.[0]; if (!file) return;
                setBulkCsvUploading(true);
                try {
                  const form = new FormData();
                  form.append('csvFile', file);
                  const res = await api.post('/loans/bulk-close/upload', form);
                  setBulkResult(res.data);
                  await fetchLoans();
                  alert(`Closed: ${res.data.closed} / ${res.data.total}`);
                } catch (err) {
                  alert('Upload failed: ' + (err.response?.data?.error || err.message));
                } finally {
                  setBulkCsvUploading(false);
                  e.target.value = '';
                }
              }} disabled={bulkCsvUploading} />
            </div>
          </div>
          {bulkResult && (
            <div className="card" style={{ marginTop: 12 }}>
              <div className="card-header"><h3>Bulk Close Result</h3></div>
              <div className="card-body">
                <p>Closed {bulkResult.closed} of {bulkResult.total}</p>
                <div className="chart-container" style={{ maxHeight: 200 }}>
                  <table className="table">
                    <thead><tr><th>Loan ID</th><th>Status</th><th>Amount Received</th><th>Error</th></tr></thead>
                    <tbody>
                      {(bulkResult.results || []).slice(0, 50).map((r, idx) => (
                        <tr key={idx}>
                          <td>{r.loan_id || '-'}</td>
                          <td>{r.ok ? 'Closed' : 'Failed'}</td>
                          <td>{r.amount_received !== undefined ? `₹${Number(r.amount_received).toLocaleString()}` : '-'}</td>
                          <td>{r.error || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3>Closed Cases ({closedLoans.length})</h3></div>
        <table className="table">
          <thead>
            <tr>
              <th>Loan ID</th>
              <th>Customer</th>
              <th>Branch</th>
              <th>Amount</th>
              <th>Net</th>
              <th>Disbursed</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {closedLoans.map(l => (
              <tr key={l.loan_id}>
                <td>{l.loan_id}</td>
                <td>{l.customer_name}</td>
                <td>{l.branch}</td>
                <td>₹{(l.loan_amount || 0).toLocaleString()}</td>
                <td>₹{(l.net_disbursement || 0).toLocaleString()}</td>
                <td>{formatCSVDate(l.date_of_disbursement)}</td>
                <td>{l.status || 'Closed'}</td>
                <td>
                  <button className="btn btn-sm btn-success" onClick={() => issueNOC(l)}>Issue NOC</button>
                  <button className="btn btn-sm btn-primary" onClick={() => viewNOC(l)} style={{ marginLeft: 8 }}>View NOC</button>
                  <button className="btn btn-sm btn-secondary" onClick={() => reopenLoan(l)} style={{ marginLeft: 8 }}>Reopen</button>
                </td>
              </tr>
            ))}
            {closedLoans.length === 0 && (
              <tr><td colSpan="7" style={{ textAlign: 'center', color: '#888' }}>No closed loans found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {nocVisible && nocData && (
        <div className="card">
          <div className="card-header"><h3>No Objection Certificate (NOC)</h3></div>
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
    </div>
  );
}
