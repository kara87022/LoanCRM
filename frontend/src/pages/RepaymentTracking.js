import React, { useState, useEffect } from 'react';
import axios from 'axios';

function RepaymentTracking() {
  const [installments, setInstallments] = useState([]);
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [paymentData, setPaymentData] = useState({ method: '', amount: '', proof: null, remarks: '' });
  const [bounceData, setBounceData] = useState({ bounceDate: '', reason: '', remarks: '' });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBounceModal, setShowBounceModal] = useState(false);

  useEffect(() => {
    fetchDueInstallments();
  }, []);

  const fetchDueInstallments = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/installments/due');
      setInstallments(response.data);
    } catch (error) {
      console.error('Error fetching installments:', error);
    }
  };

  const handlePayment = async () => {
    try {
      const formData = new FormData();
      formData.append('installment_id', selectedInstallment.installment_id);
      formData.append('method', paymentData.method);
      formData.append('amount', paymentData.amount);
      formData.append('remarks', paymentData.remarks);
      if (paymentData.proof) {
        formData.append('proof', paymentData.proof);
      }

      await axios.post('http://localhost:4000/api/payments/record', formData);
      alert('Payment recorded successfully!');
      setShowPaymentModal(false);
      setPaymentData({ method: '', amount: '', proof: null, remarks: '' });
      fetchDueInstallments();
    } catch (error) {
      alert('Error recording payment');
    }
  };

  const handleBounce = async () => {
    try {
      await axios.post('http://localhost:4000/api/installments/bounce', {
        installment_id: selectedInstallment.installment_id,
        bounce_date: bounceData.bounceDate,
        reason: bounceData.reason,
        remarks: bounceData.remarks
      });
      alert('Bounce case created successfully!');
      setShowBounceModal(false);
      setBounceData({ bounceDate: '', reason: '', remarks: '' });
      fetchDueInstallments();
    } catch (error) {
      alert('Error creating bounce case');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return '#28a745';
      case 'Overdue': return '#dc3545';
      case 'Pending': return '#ffc107';
      default: return '#6c757d';
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Repayment Tracking</h2>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>{installments.filter(i => i.status === 'Pending').length}</h3>
          <p>Due Today</p>
        </div>
        <div className="stat-card">
          <h3>{installments.filter(i => i.status === 'Overdue').length}</h3>
          <p>Overdue</p>
        </div>
        <div className="stat-card">
          <h3>₹{installments.reduce((sum, i) => sum + (i.status !== 'Paid' ? i.amount : 0), 0).toLocaleString()}</h3>
          <p>Total Due</p>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Loan ID</th>
              <th>Customer</th>
              <th>EMI Amount</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Days Overdue</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {installments.map(inst => (
              <tr key={inst.installment_id}>
                <td>{inst.loan_id}</td>
                <td>{inst.customer_name}</td>
                <td>₹{inst.amount.toLocaleString()}</td>
                <td>{inst.due_date}</td>
                <td>
                  <span style={{ 
                    background: getStatusColor(inst.status), 
                    color: 'white', 
                    padding: '2px 6px', 
                    borderRadius: '3px', 
                    fontSize: '8px' 
                  }}>
                    {inst.status}
                  </span>
                </td>
                <td>{inst.days_overdue > 0 ? `${inst.days_overdue}d` : '-'}</td>
                <td>
                  {inst.status !== 'Paid' && (
                    <>
                      <button 
                        className="btn btn-primary" 
                        style={{ fontSize: '8px', padding: '3px 6px', marginRight: '4px' }}
                        onClick={() => {
                          setSelectedInstallment(inst);
                          setShowPaymentModal(true);
                        }}
                      >
                        Record Payment
                      </button>
                      <button 
                        className="btn btn-danger" 
                        style={{ fontSize: '8px', padding: '3px 6px' }}
                        onClick={() => {
                          setSelectedInstallment(inst);
                          setShowBounceModal(true);
                        }}
                      >
                        Mark Bounced
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '400px' }}>
            <h3 style={{ fontSize: '14px', marginBottom: '12px' }}>Record Payment</h3>
            <div className="form-group">
              <label>Payment Method:</label>
              <select 
                className="form-control" 
                value={paymentData.method}
                onChange={(e) => setPaymentData({...paymentData, method: e.target.value})}
              >
                <option value="">Select Method</option>
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
            <div className="form-group">
              <label>Amount:</label>
              <input 
                type="number" 
                className="form-control"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                placeholder={`EMI Amount: ₹${selectedInstallment?.amount}`}
              />
            </div>
            <div className="form-group">
              <label>Upload Proof:</label>
              <input 
                type="file" 
                className="form-control"
                accept="image/*"
                onChange={(e) => setPaymentData({...paymentData, proof: e.target.files[0]})}
              />
            </div>
            <div className="form-group">
              <label>Remarks:</label>
              <textarea 
                className="form-control" 
                rows="2"
                value={paymentData.remarks}
                onChange={(e) => setPaymentData({...paymentData, remarks: e.target.value})}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handlePayment}>Record Payment</button>
            </div>
          </div>
        </div>
      )}

      {/* Bounce Modal */}
      {showBounceModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '400px' }}>
            <h3 style={{ fontSize: '14px', marginBottom: '12px' }}>Mark as Bounced</h3>
            <div className="form-group">
              <label>Bounce Date:</label>
              <input 
                type="date" 
                className="form-control"
                value={bounceData.bounceDate}
                onChange={(e) => setBounceData({...bounceData, bounceDate: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Bounce Reason:</label>
              <select 
                className="form-control"
                value={bounceData.reason}
                onChange={(e) => setBounceData({...bounceData, reason: e.target.value})}
              >
                <option value="">Select Reason</option>
                <option value="Insufficient Funds">Insufficient Funds</option>
                <option value="Account Closed">Account Closed</option>
                <option value="Customer Unavailable">Customer Unavailable</option>
                <option value="Payment Declined">Payment Declined</option>
                <option value="Technical Issue">Technical Issue</option>
              </select>
            </div>
            <div className="form-group">
              <label>Remarks:</label>
              <textarea 
                className="form-control" 
                rows="3"
                value={bounceData.remarks}
                onChange={(e) => setBounceData({...bounceData, remarks: e.target.value})}
                placeholder="Additional details about the bounce..."
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowBounceModal(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleBounce}>Create Bounce Case</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RepaymentTracking;