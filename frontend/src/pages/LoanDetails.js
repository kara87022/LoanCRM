import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';
import { formatCSVDate } from '../utils/date';

const api = axios.create({ baseURL: 'http://localhost:4000/api' });
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function LoanDetails() {
  const { id } = useParams(); // expects route like /loans/:id/details
  const navigate = useNavigate();
  const [loan, setLoan] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentModal, setPaymentModal] = useState({ open: false, row: null, utr: '', received_date: new Date().toISOString().slice(0,10), method: 'bank', remarks: '' });
  const [collected, setCollected] = useState(0);

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      setLoading(true);
      setError('');
      try {
        const [loanRes, schRes] = await Promise.all([
          api.get(`/loans/${id}`),
          api.get(`/loans/${id}/repayment-schedule`)
        ]);
        if (!mounted) return;
        setLoan(loanRes.data || null);
        // fetch collected amount for outstanding calculation
        try {
          const sumRes = await api.post('/collections/query', {
            query: `SELECT COALESCE(SUM(amount),0) as collected FROM payments WHERE loan_id = '${id}'`
          });
          setCollected(Number(sumRes.data?.[0]?.collected || 0));
        } catch (e) {
          setCollected(0);
        }
        setSchedule((schRes.data?.repayment_schedule || []).map(r => ({
          installment: r.installment,
          amount: r.amount,
          due_date: r.due_date
        })));
      } catch (e) {
        if (!mounted) return;
        setError(e.response?.data?.error || e.message || 'Failed to load loan details');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchAll();
    return () => { mounted = false; };
  }, [id]);

  const handleSaveRow = async (row, idx) => {
    try {
      if (!row.installment_id) {
        let schRes = await api.get(`/installments/by-loan/${loan.loan_id}`);
        let found = (schRes.data||[]).find(r=>r.installment_number===row.installment);
        if (!found) {
          await api.post(`/installments/generate-if-missing/${loan.loan_id}`);
          schRes = await api.get(`/installments/by-loan/${loan.loan_id}`);
          found = (schRes.data||[]).find(r=>r.installment_number===row.installment);
        }
        if (found) row.installment_id = found.installment_id;
        else { alert('Installments not found. Please ensure schedule is generated.'); return; }
      }
      await api.put(`/installments/${row.installment_id}`, {
        due_date: (row.due_date||'').slice(0,10),
        amount: row.amount,
        status: row.status||'Pending'
      });
      setPaymentModal({ open: true, row: { ...row }, utr: '', received_date: new Date().toISOString().slice(0,10), method: 'bank', remarks: '' });
    } catch (e) {
      alert('Failed to update: ' + (e.response?.data?.error || e.message));
    }
  };

  const submitPayment = async () => {
    try {
      const { row, utr, received_date, method, remarks } = paymentModal;
      if (!row?.installment_id) { setPaymentModal({ ...paymentModal, open: false }); return; }
      await api.post('/payments/record', {
        installment_id: row.installment_id,
        amount: row.amount,
        method,
        remarks: remarks || 'Updated from Loan Details',
        utr: utr || null,
        received_date
      });
      setPaymentModal({ open: false, row: null, utr: '', received_date: new Date().toISOString().slice(0,10), method: 'bank', remarks: '' });
      alert('Installment updated and payment recorded');
    } catch (e) {
      alert('Failed to record payment: ' + (e.response?.data?.error || e.message));
    }
  };

  if (loading) return <div className="loading">Loading loan details...</div>;
  if (error) return (
    <div className="card" style={{ padding: 16 }}>
      <p style={{ color: '#dc3545' }}>{error}</p>
      <button className="btn btn-secondary" onClick={() => navigate(-1)}>Go Back</button>
    </div>
  );
  if (!loan) return (
    <div className="card" style={{ padding: 16 }}>
      <p>No loan found</p>
      <button className="btn btn-secondary" onClick={() => navigate(-1)}>Go Back</button>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h2>Loan Details</h2>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>Back</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-header"><h3>Summary</h3></div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Loan ID</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1f2937' }}>{loan.loan_id}</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Customer</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1f2937' }}>{loan.customer_name}</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Loan Amount</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1f2937' }}>₹{(loan.loan_amount || 0).toLocaleString()}</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Status</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1f2937' }}>{loan.status || 'Active'}</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Total Repayment Amount</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1f2937' }}>₹{(loan.repayment_amount || 0).toLocaleString()}</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Current Outstanding</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1f2937' }}>₹{Math.max((loan.repayment_amount || 0) - (collected || 0), 0).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><h3>Primary Information</h3></div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div><strong>Branch:</strong> {loan.branch || 'N/A'}</div>
            <div><strong>Sourced By:</strong> {loan.sourced_by || 'N/A'}</div>
            <div><strong>ROI:</strong> {loan.roi || 0}%</div>
            <div><strong>Tenure:</strong> {loan.tenure_days || 0} days</div>
            <div><strong>Disbursement:</strong> {formatCSVDate(loan.date_of_disbursement) || 'N/A'}</div>
            <div><strong>Installment Amount:</strong> ₹{(loan.installment_amount || 0).toLocaleString()}</div>
            <div><strong>Total Installments:</strong> {loan.total_installments || loan.no_of_installment || 14}</div>
            <div><strong>Repayment Amount:</strong> ₹{(loan.repayment_amount || 0).toLocaleString()}</div>
            <div><strong>Net Disbursement:</strong> ₹{(loan.net_disbursement || 0).toLocaleString()}</div>
            <div><strong>Interest Earned:</strong> ₹{(loan.interest_earned || 0).toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3>Repayment Schedule</h3></div>
        {schedule.length === 0 ? (
          <div className="card-body">
            No schedule found
            <div style={{ marginTop: 10 }}>
              <button className="btn btn-primary" onClick={async ()=>{
                try {
                  await api.post(`/installments/generate-if-missing/${loan.loan_id}`);
                  const schRes = await api.get(`/installments/by-loan/${loan.loan_id}`);
                  setSchedule(schRes.data.map(r=>({ installment: r.installment_number, amount: r.amount, due_date: r.due_date, installment_id: r.installment_id, status: r.status })));
                } catch (e) {
                  alert('Failed to generate: ' + (e.response?.data?.error || e.message));
                }
              }}>Generate 14 Installments</button>
            </div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Installment</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((row, idx) => (
                <tr key={row.installment}>
                  <td>{row.installment}</td>
                  <td>
                    <input type="date" className="form-control" value={(row.due_date||'').slice(0,10)} onChange={(e)=>{
                      const v=e.target.value; setSchedule(s=>s.map((r,i)=> i===idx?{...r, due_date:v}:r));
                    }} />
                  </td>
                  <td>
                    <input type="number" className="form-control" value={row.amount} onChange={(e)=>{
                      const v=Number(e.target.value||0); setSchedule(s=>s.map((r,i)=> i===idx?{...r, amount:v}:r));
                    }} />
                  </td>
                  <td>
                    <select className="form-control" value={row.status||'Pending'} onChange={(e)=>{
                      const v=e.target.value; setSchedule(s=>s.map((r,i)=> i===idx?{...r, status:v}:r));
                    }}>
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-success" onClick={()=>handleSaveRow(row, idx)}>Save</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {paymentModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: 20, borderRadius: 6, width: 420, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0 }}>Record Payment</h3>
            <div className="form-group">
              <label>UTR</label>
              <input type="text" className="form-control" value={paymentModal.utr} onChange={(e)=>setPaymentModal(pm=>({ ...pm, utr: e.target.value }))} placeholder="Enter UTR (optional)" />
            </div>
            <div className="form-group">
              <label>Date of Receiving</label>
              <input type="date" className="form-control" value={paymentModal.received_date} onChange={(e)=>setPaymentModal(pm=>({ ...pm, received_date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Mode of Payment</label>
              <select className="form-control" value={paymentModal.method} onChange={(e)=>setPaymentModal(pm=>({ ...pm, method: e.target.value }))}>
                <option value="bank">Bank</option>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="cheque">Cheque</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Remarks</label>
              <input type="text" className="form-control" value={paymentModal.remarks} onChange={(e)=>setPaymentModal(pm=>({ ...pm, remarks: e.target.value }))} placeholder="Optional" />
            </div>
            <div className="form-actions" style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-secondary" onClick={()=>setPaymentModal(pm=>({ ...pm, open: false }))}>Cancel</button>
              <button className="btn btn-primary" onClick={submitPayment}>Save Payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
