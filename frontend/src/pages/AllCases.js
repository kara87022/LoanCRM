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

export default function AllCases() {
  const [loans, setLoans] = useState([]);
  const [stats, setStats] = useState({}); // { [loan_id]: { total_emis, received_installments, collected_amount } }
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [busyLoan, setBusyLoan] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [loansRes, statsRes] = await Promise.all([
        api.get('/loans'),
        api.post('/collections/query', {
          query: `
            SELECT 
              l.loan_id,
              COUNT(i.installment_id) AS total_emis,
              COUNT(CASE WHEN i.status = 'Paid' THEN 1 END) AS received_installments,
              COALESCE(SUM(p.amount), 0) AS collected_amount
            FROM loans_master l
            LEFT JOIN installments i ON i.loan_id = l.loan_id
            LEFT JOIN payments p ON p.loan_id = l.loan_id
            GROUP BY l.loan_id
          `
        })
      ]);
      setLoans(loansRes.data || []);
      const map = {};
      (statsRes.data || []).forEach(r => {
        map[r.loan_id] = {
          total_emis: Number(r.total_emis || 0),
          received_installments: Number(r.received_installments || 0),
          collected_amount: Number(r.collected_amount || 0)
        };
      });
      setStats(map);
    } catch (e) {
      console.error('Load all cases failed:', e);
      alert('Failed to load. Ensure backend is running and you are logged in.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (loans || []).filter(l => !q || (l.loan_id || '').toLowerCase().includes(q) || (l.customer_name || '').toLowerCase().includes(q) || (l.branch || '').toLowerCase().includes(q));
  }, [loans, search]);

  const statusBadge = (s) => {
    const v = String(s || 'Active').toLowerCase();
    const color = v === 'closed' ? '#28a745' : v === 'foreclosed' ? '#dc3545' : '#17a2b8';
    return <span className="status-badge" style={{ background: color }}>{s || 'Active'}</span>;
  };

  const fmt = (n) => `₹${Number(n || 0).toLocaleString()}`;

  const updateStatus = async (loan, status) => {
    setBusyLoan(loan.loan_id);
    try {
      await api.put(`/loans/${loan.loan_id}/status`, { status });
      await loadData();
    } catch (e) {
      alert('Failed to update status: ' + (e.response?.data?.error || e.message));
    } finally {
      setBusyLoan('');
    }
  };

  const generateIfMissing = async (loan) => {
    setBusyLoan(loan.loan_id);
    try {
      const res = await api.post(`/installments/generate-if-missing/${loan.loan_id}`);
      alert(res.data?.message || 'Done');
      await loadData();
    } catch (e) {
      alert('Failed to generate installments: ' + (e.response?.data?.error || e.message));
    } finally {
      setBusyLoan('');
    }
  };

  const markNextPaid = async (loan) => {
    setBusyLoan(loan.loan_id);
    try {
      await api.post('/installments/mark-next-paid', { loan_id: loan.loan_id });
      await loadData();
    } catch (e) {
      alert('Failed to mark paid: ' + (e.response?.data?.error || e.message));
    } finally {
      setBusyLoan('');
    }
  };

  const quickClose = async (loan) => {
    const installmentsStr = prompt('Enter number of installments received (0-14):', '14');
    if (installmentsStr === null) return;
    const count = Math.max(0, Math.min(14, Number(installmentsStr)));

    const amountStr = prompt('Enter total amount received (optional, for note):', '');

    setBusyLoan(loan.loan_id);
    try {
      // Ensure installments exist
      await api.post(`/installments/generate-if-missing/${loan.loan_id}`);
      // Mark next N as paid
      for (let i = 0; i < count; i++) {
        await api.post('/installments/mark-next-paid', { loan_id: loan.loan_id });
      }
      // Update status to Closed or Foreclosed depending if fully paid
      const st = count >= 14 ? 'Closed' : 'Foreclosed';
      await api.put(`/loans/${loan.loan_id}/status`, { status: st });
      alert(`Loan ${st}. ${amountStr ? 'Amount noted: ' + amountStr : ''}`);
      await loadData();
    } catch (e) {
      alert('Quick close failed: ' + (e.response?.data?.error || e.message));
    } finally {
      setBusyLoan('');
    }
  };

  const totals = useMemo(() => {
    const list = filtered.map(l => ({
      amount: Number(l.loan_amount || 0),
      net: Number(l.net_disbursement || 0),
      collected: Number(stats[l.loan_id]?.collected_amount || 0)
    }));
    return {
      count: filtered.length,
      amount: list.reduce((s, x) => s + x.amount, 0),
      net: list.reduce((s, x) => s + x.net, 0),
      collected: list.reduce((s, x) => s + x.collected, 0)
    };
  }, [filtered, stats]);

  return (
    <div>
      <div className="page-header">
        <h2>All Cases</h2>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={loadData} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 16 }}>
        <div className="stat-card"><h3>{totals.count}</h3><p>Cases</p></div>
        <div className="stat-card"><h3>{fmt(totals.amount)}</h3><p>Total Amount</p></div>
        <div className="stat-card"><h3>{fmt(totals.net)}</h3><p>Total Net</p></div>
        <div className="stat-card"><h3>{fmt(totals.collected)}</h3><p>Collected</p></div>
      </div>

      <div className="search-bar">
        <input className="form-control" placeholder="Search by Loan ID / Customer / Branch" value={search} onChange={e=>setSearch(e.target.value)} />
      </div>

      <div className="card">
        <div className="card-header"><h3>Cases ({filtered.length})</h3></div>
        <table className="table">
          <thead>
            <tr>
              <th>Loan ID</th>
              <th>Customer</th>
              <th>Branch</th>
              <th>Status</th>
              <th>Disbursed</th>
              <th>Amount</th>
              <th>Net</th>
              <th>Collected</th>
              <th>EMIs</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => {
              const st = stats[l.loan_id] || { total_emis: 0, received_installments: 0, collected_amount: 0 };
              return (
                <tr key={l.loan_id}>
                  <td>
                    <a href={`/loans/${l.loan_id}/details`} style={{ color: '#007bff', textDecoration: 'underline' }}>
                      {l.loan_id}
                    </a>
                  </td>
                  <td>{l.customer_name}</td>
                  <td>{l.branch}</td>
                  <td>{statusBadge(l.status)}</td>
                  <td>{formatCSVDate(l.date_of_disbursement) || 'N/A'}</td>
                  <td>{fmt(l.loan_amount)}</td>
                  <td>{fmt(l.net_disbursement)}</td>
                  <td>{fmt(st.collected_amount)}</td>
                  <td>{st.received_installments}/{st.total_emis || (l.total_installments || l.no_of_installment || 14)}</td>
                  <td>
                    <select disabled={busyLoan===l.loan_id} value={l.status || 'Active'} onChange={(e)=>updateStatus(l, e.target.value)}>
                      <option value="Active">Active</option>
                      <option value="Closed">Closed</option>
                      <option value="Foreclosed">Foreclosed</option>
                    </select>
                    <button className="btn btn-sm btn-secondary" onClick={()=>generateIfMissing(l)} disabled={busyLoan===l.loan_id} style={{ marginLeft: 6 }}>Gen 14</button>
                    <button className="btn btn-sm btn-success" onClick={()=>markNextPaid(l)} disabled={busyLoan===l.loan_id} style={{ marginLeft: 6 }}>Mark Next Paid</button>
                    <button className="btn btn-sm btn-primary" onClick={()=>quickClose(l)} disabled={busyLoan===l.loan_id} style={{ marginLeft: 6 }}>Quick Close</button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan="10" style={{ textAlign: 'center', color: '#888' }}>No cases found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
