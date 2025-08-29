import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../App.css';

const api = axios.create({ baseURL: 'http://localhost:4000/api' });
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function NOCPage() {
  const [loanId, setLoanId] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [loan, setLoan] = useState(null);
  const [noc, setNoc] = useState(null);
  const [closedLoans, setClosedLoans] = useState([]);

  useEffect(() => {
    fetchClosedLoans();
  }, []);

  const fetchClosedLoans = async () => {
    try {
      const res = await api.get('/loans');
      const closed = (res.data || []).filter(l => String(l.status || '').toLowerCase() === 'closed');
      setClosedLoans(closed);
    } catch (e) {
      setClosedLoans([]);
    }
  };

  const fetchLoanAndNoc = async (id) => {
    const target = (id || loanId).trim();
    if (!target) { alert('Enter Loan ID'); return; }
    setLoading(true);
    setLoan(null);
    setNoc(null);
    try {
      const [loanRes, nocRes] = await Promise.all([
        api.get(`/loans/${target}`),
        api.get(`/loans/${target}/noc`).catch(err => {
          if (err.response && err.response.status === 404) return { data: null };
          throw err;
        })
      ]);
      setLoan(loanRes.data || null);
      setNoc(nocRes.data || null);
    } catch (e) {
      alert('Failed to fetch: ' + (e.response?.data?.error || e.message));
    } finally {
      setLoading(false);
    }
  };

  const issueNOC = async (id) => {
    const target = (id || loanId).trim();
    if (!target) { alert('Enter Loan ID'); return; }
    setLoading(true);
    try {
      const res = await api.post(`/loans/${target}/noc`, { note: (note || '').trim() || null });
      setNoc(res.data);
      alert('NOC issued');
    } catch (e) {
      alert('Failed to issue NOC: ' + (e.response?.data?.error || e.message));
    } finally {
      setLoading(false);
    }
  };

  const printNOC = () => {
    window.print();
  };

  const Summary = ({ title, value }) => (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 10 }}>
      <div style={{ fontSize: 11, color: '#6b7280' }}>{title}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#1f2937' }}>{value}</div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h2>NOC Management</h2>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={fetchClosedLoans} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</button>
        </div>
      </div>

      <div className="card form-card">
        <div className="card-header"><h3>Find/Issue NOC</h3></div>
        <div className="card-body">
          <div className="form-row">
            <div className="form-group">
              <label>Loan ID</label>
              <input className="form-control" value={loanId} onChange={(e)=>setLoanId(e.target.value)} placeholder="Enter Loan ID (e.g., BL000026)" />
            </div>
            <div className="form-group">
              <label>Note (optional)</label>
              <input className="form-control" value={note} onChange={(e)=>setNote(e.target.value)} placeholder="Optional note for NOC" />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={()=>fetchLoanAndNoc()} disabled={loading}>Fetch Loan & NOC</button>
            <button className="btn btn-success" onClick={()=>issueNOC()} disabled={loading || !loanId}>Issue NOC</button>
          </div>
        </div>
      </div>

      {loan && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="card-header"><h3>Loan Summary</h3></div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <Summary title="Loan ID" value={loan.loan_id} />
              <Summary title="Customer" value={loan.customer_name} />
              <Summary title="Loan Amount" value={`₹${(loan.loan_amount || 0).toLocaleString()}`} />
              <Summary title="Status" value={loan.status || 'Active'} />
              <Summary title="Repayment Amount" value={`₹${(loan.repayment_amount || 0).toLocaleString()}`} />
              <Summary title="Disbursement Date" value={loan.date_of_disbursement || 'N/A'} />
            </div>
          </div>
        </div>
      )}

      {noc && (
        <div className="card">
          <div className="card-header"><h3>NOC Details</h3></div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <Summary title="Reference No" value={noc.reference_no} />
              <Summary title="Borrower" value={noc.borrower_name} />
              <Summary title="Issued By" value={noc.issued_by} />
              <Summary title="Issued At" value={new Date(noc.issued_at).toISOString().slice(0,10)} />
              <Summary title="Loan ID" value={noc.loan_id} />
              <Summary title="Note" value={noc.note || '-'} />
            </div>
            <div className="form-actions" style={{ marginTop: 12 }}>
              <button className="btn btn-primary" onClick={printNOC}>Print NOC</button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header"><h3>Closed Loans</h3></div>
        <div className="card-body">
          {closedLoans.length === 0 ? (
            <div className="loading">No closed loans found</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Loan ID</th>
                  <th>Customer</th>
                  <th>Loan Amount</th>
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
                    <td>₹{(l.loan_amount || 0).toLocaleString()}</td>
                    <td>{l.date_of_disbursement || 'N/A'}</td>
                    <td>{l.status || 'Closed'}</td>
                    <td>
                      <button className="btn btn-sm btn-primary" onClick={()=>{ setLoanId(l.loan_id); fetchLoanAndNoc(l.loan_id); }}>View NOC</button>
                      <button className="btn btn-sm btn-success" style={{ marginLeft: 6 }} onClick={()=>{ setLoanId(l.loan_id); setNote(''); issueNOC(l.loan_id); }}>Issue NOC</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
