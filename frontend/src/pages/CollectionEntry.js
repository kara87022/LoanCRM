import React, { useState, useEffect } from 'react';
import axios from 'axios';

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

export default function CollectionEntry() {
  const [pendingEMIs, setPendingEMIs] = useState([]);
  const [selectedEMI, setSelectedEMI] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    method: 'Cash',
    date: new Date().toISOString().split('T')[0],
    remarks: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPendingEMIs();
  }, []);

  const fetchPendingEMIs = async () => {
    try {
      const response = await api.post('/collections/query', {
        query: `
          SELECT 
            i.installment_id, i.loan_id, l.customer_name, i.installment_number,
            i.amount, i.due_date, i.status,
            DATEDIFF(CURDATE(), i.due_date) as days_overdue
          FROM installments i
          JOIN loans_master l ON i.loan_id = l.loan_id
          WHERE i.status IN ('Pending', 'Overdue')
          ORDER BY i.due_date ASC
          LIMIT 50
        `
      });
      setPendingEMIs(response.data || []);
    } catch (error) {
      console.error('Error fetching pending EMIs:', error);
    }
  };

  const recordPayment = async () => {
    if (!selectedEMI || !paymentData.amount) {
      alert('Please select an EMI and enter payment amount');
      return;
    }

    setLoading(true);
    try {
      // Record payment
      await api.post('/collections/query', {
        query: `
          INSERT INTO payments (loan_id, amount, method, payment_date, remarks, recorded_by) 
          VALUES ('${selectedEMI.loan_id}', ${paymentData.amount}, '${paymentData.method}', '${paymentData.date}', '${paymentData.remarks}', 'Manual Entry')
        `
      });

      // Update installment status
      const newStatus = parseFloat(paymentData.amount) >= selectedEMI.amount ? 'Paid' : 'Partial';
      await api.post('/collections/query', {
        query: `
          UPDATE installments 
          SET status = '${newStatus}' 
          WHERE installment_id = ${selectedEMI.installment_id}
        `
      });

      alert('Payment recorded successfully!');
      setSelectedEMI(null);
      setPaymentData({
        amount: '',
        method: 'Cash',
        date: new Date().toISOString().split('T')[0],
        remarks: ''
      });
      fetchPendingEMIs();
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Error recording payment: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Collection Entry</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Pending EMIs */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>Pending EMIs ({pendingEMIs.length})</h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {pendingEMIs.map((emi) => (
              <div
                key={emi.installment_id}
                onClick={() => {
                  setSelectedEMI(emi);
                  setPaymentData(prev => ({ ...prev, amount: emi.amount }));
                }}
                style={{
                  padding: '10px',
                  margin: '5px 0',
                  border: selectedEMI?.installment_id === emi.installment_id ? '2px solid #007bff' : '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  background: emi.days_overdue > 0 ? '#fff5f5' : '#f8f9fa'
                }}
              >
                <div style={{ fontWeight: 'bold' }}>{emi.loan_id} - {emi.customer_name}</div>
                <div>EMI #{emi.installment_number} - ₹{emi.amount}</div>
                <div style={{ fontSize: '0.9em', color: '#666' }}>
                  Due: {new Date(emi.due_date).toLocaleDateString()}
                  {emi.days_overdue > 0 && (
                    <span style={{ color: '#dc3545', marginLeft: '10px' }}>
                      {emi.days_overdue} days overdue
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Entry */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>Record Payment</h3>
          
          {selectedEMI ? (
            <div>
              <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '4px', marginBottom: '20px' }}>
                <div><strong>Loan ID:</strong> {selectedEMI.loan_id}</div>
                <div><strong>Customer:</strong> {selectedEMI.customer_name}</div>
                <div><strong>EMI:</strong> #{selectedEMI.installment_number}</div>
                <div><strong>Amount Due:</strong> ₹{selectedEMI.amount}</div>
                <div><strong>Due Date:</strong> {new Date(selectedEMI.due_date).toLocaleDateString()}</div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Payment Amount</label>
                <input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Payment Method</label>
                <select
                  value={paymentData.method}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, method: e.target.value }))}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Payment Date</label>
                <input
                  type="date"
                  value={paymentData.date}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, date: e.target.value }))}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Remarks</label>
                <textarea
                  value={paymentData.remarks}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, remarks: e.target.value }))}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', height: '60px' }}
                  placeholder="Optional remarks..."
                />
              </div>

              <button
                onClick={recordPayment}
                disabled={loading || !paymentData.amount}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                {loading ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#666', padding: '50px' }}>
              Select an EMI from the left to record payment
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button
          onClick={fetchPendingEMIs}
          style={{
            padding: '10px 20px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Refresh Pending EMIs
        </button>
      </div>
    </div>
  );
}