import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import '../../App.css';

const api = axios.create({ baseURL: 'http://localhost:4000/api' });
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function DisbursementEntry() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => { fetchLoans(); }, []);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const res = await api.get('/loans');
      setLoans(res.data || []);
    } catch (err) {
      console.error('Fetch loans error:', err);
      alert('Failed to load loans. Ensure backend is running and you are logged in.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return loans;
    return loans.filter(l =>
      (l.loan_id || '').toLowerCase().includes(q) ||
      (l.customer_name || '').toLowerCase().includes(q) ||
      (l.branch || '').toLowerCase().includes(q)
    );
  }, [loans, search]);

  const [form, setForm] = useState({
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

  const selectLoan = (loan) => {
    setSelected(loan);
    setForm({
      loan_id: loan.loan_id || '',
      branch: loan.branch || '',
      sourced_by: loan.sourced_by || '',
      customer_name: loan.customer_name || '',
      loan_amount: loan.loan_amount || '',
      processing_fee: loan.processing_fee ?? loan.pf ?? '',
      gst: loan.gst ?? '',
      net_disbursement: loan.net_disbursement ?? '',
      repayment_amount: loan.repayment_amount ?? '',
      interest_earned: loan.interest_earned ?? '',
      roi: loan.roi ?? '',
      tenure_days: loan.tenure_days ?? '',
      date_of_disbursement: loan.date_of_disbursement || '',
      installment_amount: loan.installment_amount ?? '',
      total_installments: loan.total_installments ?? loan.no_of_installment ?? ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const normalizeNumber = (v) => {
    if (v === '' || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };

  const onSave = async () => {
    if (!form.loan_id) {
      alert('Select a loan first');
      return;
    }
    setSaving(true);
    try {
      // Prepare payload for loans_master
      const payload = {
        branch: form.branch || '',
        sourced_by: form.sourced_by || '',
        customer_name: form.customer_name || '',
        loan_amount: normalizeNumber(form.loan_amount) ?? 0,
        processing_fee: normalizeNumber(form.processing_fee) ?? 0,
        gst: normalizeNumber(form.gst) ?? 0,
        net_disbursement: normalizeNumber(form.net_disbursement) ?? 0,
        repayment_amount: normalizeNumber(form.repayment_amount) ?? 0,
        interest_earned: normalizeNumber(form.interest_earned) ?? 0,
        roi: normalizeNumber(form.roi) ?? 0,
        tenure_days: normalizeNumber(form.tenure_days) ?? 0,
        date_of_disbursement: form.date_of_disbursement || null,
        installment_amount: normalizeNumber(form.installment_amount) ?? 0,
        total_installments: normalizeNumber(form.total_installments) ?? 0
      };

      // Update primary loan record
      await api.put(`/loans/${form.loan_id}`, payload);

      // Also update disbursed_cases ledger when present
      const ledgerPayload = {
        branch: payload.branch,
        sourced_by: payload.sourced_by,
        customer_name: payload.customer_name,
        loan_amount: payload.loan_amount,
        pf: payload.processing_fee,
        gst: payload.gst,
        net_disbursement: payload.net_disbursement,
        repayment_amount: payload.repayment_amount,
        interest_earned: payload.interest_earned,
        date_of_disbursement: payload.date_of_disbursement,
        installment_amount: payload.installment_amount,
        no_of_installment: payload.total_installments
      };
      try { await api.put(`/disbursed-cases/${form.loan_id}`, ledgerPayload); } catch (e) { /* ignore if not existing */ }

      alert('Disbursement entry saved successfully');
      await fetchLoans();
      // refresh selected
      const updated = (await api.get(`/loans/${form.loan_id}`)).data;
      selectLoan(updated);
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save disbursement entry: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const generateEMIForSelected = async () => {
    if (!form.loan_id) {
      alert('Select a loan first');
      return;
    }
    const amt = normalizeNumber(form.loan_amount);
    if (!amt || !form.date_of_disbursement) {
      alert('Loan amount and disbursement date are required to generate EMIs');
      return;
    }
    try {
      const body = {
        loan_id: form.loan_id,
        loan_amount: amt,
        date_of_disbursement: form.date_of_disbursement
      };
      await api.post('/installments/generate', body);
      alert('EMI schedule generated for this loan');
    } catch (err) {
      console.error('Generate EMI error:', err);
      alert('Failed to generate EMIs: ' + (err.response?.data?.error || err.message));
    }
  };

  const totalDisbursed = useMemo(() => loans.reduce((s, l) => s + (l.net_disbursement || 0), 0), [loans]);

  return (
    <div>
      <div className="page-header">
        <h2>Disbursement Entry</h2>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={fetchLoans} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="stats-grid" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <h3>{loans.length}</h3>
          <p>Total Loans</p>
        </div>
        <div className="stat-card">
          <h3>₹{totalDisbursed.toLocaleString()}</h3>
          <p>Total Net Disbursed</p>
        </div>
      </div>

      {/* Edit form */}
      <div className="card form-card">
        <div className="card-header">
          <h3>{selected ? `Edit Disbursement: ${selected.loan_id}` : 'Select a loan to edit'}</h3>
        </div>
        <div className="card-body">
          <div className="form-row">
            <div className="form-group">
              <label>Loan ID</label>
              <input className="form-control" type="text" value={form.loan_id} disabled />
            </div>
            <div className="form-group">
              <label>Customer</label>
              <input className="form-control" type="text" value={form.customer_name} onChange={(e)=>updateField('customer_name', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Branch</label>
              <input className="form-control" type="text" value={form.branch} onChange={(e)=>updateField('branch', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Sourced By</label>
              <input className="form-control" type="text" value={form.sourced_by} onChange={(e)=>updateField('sourced_by', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Loan Amount</label>
              <input className="form-control" type="number" value={form.loan_amount} onChange={(e)=>updateField('loan_amount', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Processing Fee</label>
              <input className="form-control" type="number" value={form.processing_fee} onChange={(e)=>updateField('processing_fee', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>GST</label>
              <input className="form-control" type="number" value={form.gst} onChange={(e)=>updateField('gst', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Net Disbursement</label>
              <input className="form-control" type="number" value={form.net_disbursement} onChange={(e)=>updateField('net_disbursement', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Repayment Amount</label>
              <input className="form-control" type="number" value={form.repayment_amount} onChange={(e)=>updateField('repayment_amount', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Interest Earned</label>
              <input className="form-control" type="number" value={form.interest_earned} onChange={(e)=>updateField('interest_earned', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>ROI (%)</label>
              <input className="form-control" type="number" step="0.01" value={form.roi} onChange={(e)=>updateField('roi', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Tenure (days)</label>
              <input className="form-control" type="number" value={form.tenure_days} onChange={(e)=>updateField('tenure_days', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date of Disbursement</label>
              <input className="form-control" type="date" value={form.date_of_disbursement} onChange={(e)=>updateField('date_of_disbursement', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Installment Amount (EMI)</label>
              <input className="form-control" type="number" value={form.installment_amount} onChange={(e)=>updateField('installment_amount', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Total Installments</label>
              <input className="form-control" type="number" value={form.total_installments} onChange={(e)=>updateField('total_installments', e.target.value)} />
            </div>
          </div>

          <div className="form-actions">
            <button className="btn btn-success" onClick={onSave} disabled={saving || !selected}>
              {saving ? 'Saving...' : 'Save Disbursement'}
            </button>
            <button className="btn btn-warning" onClick={generateEMIForSelected} disabled={!selected}>
              Generate EMIs
            </button>
          </div>
        </div>
      </div>

      {/* Loans table */}
      <div className="card">
        <div className="card-header">
          <h3>Loans</h3>
        </div>
        <div className="card-body">
          <div className="search-bar">
            <input className="form-control" placeholder="Search by ID / customer / branch" value={search} onChange={(e)=>setSearch(e.target.value)} />
          </div>
          {loading ? (
            <div className="loading">Loading loans...</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Loan ID</th>
                  <th>Customer</th>
                  <th>Branch</th>
                  <th>Amount</th>
                  <th>Net</th>
                  <th>Repayment</th>
                  <th>Disbursement Date</th>
                  <th>EMI</th>
                  <th>Installments</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.loan_id}>
                    <td>{l.loan_id}</td>
                    <td>{l.customer_name}</td>
                    <td>{l.branch}</td>
                    <td>₹{(l.loan_amount || 0).toLocaleString()}</td>
                    <td>₹{(l.net_disbursement || 0).toLocaleString()}</td>
                    <td>₹{(l.repayment_amount || 0).toLocaleString()}</td>
                    <td>{l.date_of_disbursement || '-'}</td>
                    <td>₹{(l.installment_amount || 0).toLocaleString()}</td>
                    <td>{l.total_installments || l.no_of_installment || 0}</td>
                    <td>{l.status || 'Active'}</td>
                    <td>
                      <button className="btn btn-sm btn-primary" onClick={() => selectLoan(l)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={11} style={{ textAlign: 'center', color: '#888' }}>No loans found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
