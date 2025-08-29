import React, { useState } from 'react';

export default function PayEmi() {
  const [paymentData, setPaymentData] = useState({
    loanId: '',
    amount: '',
    method: 'UPI'
  });
  const [loading, setLoading] = useState(false);

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      alert('Payment processed successfully!');
      setPaymentData({ loanId: '', amount: '', method: 'UPI' });
      setLoading(false);
    }, 2000);
  };

  return (
    <div>
      <div className="page-header">
        <h2>Pay EMI</h2>
      </div>
      <div className="card">
        <div className="card-header">
          <h3>EMI Payment</h3>
        </div>
        <form onSubmit={handlePayment} style={{ padding: '20px' }}>
          <div className="form-row">
            <div className="form-group">
              <label>Loan ID</label>
              <input
                type="text"
                value={paymentData.loanId}
                onChange={(e) => setPaymentData({...paymentData, loanId: e.target.value})}
                className="form-control"
                placeholder="Enter Loan ID"
                required
              />
            </div>
            <div className="form-group">
              <label>Payment Amount</label>
              <input
                type="number"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                className="form-control"
                placeholder="Enter amount"
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Payment Method</label>
              <select
                value={paymentData.method}
                onChange={(e) => setPaymentData({...paymentData, method: e.target.value})}
                className="form-control"
              >
                <option value="UPI">UPI</option>
                <option value="Net Banking">Net Banking</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Credit Card">Credit Card</option>
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" disabled={loading} className="btn btn-success">
              {loading ? 'Processing...' : 'Pay Now'}
            </button>
            <button type="button" className="btn btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}