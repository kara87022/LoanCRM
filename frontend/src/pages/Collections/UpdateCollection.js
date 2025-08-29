import React, { useEffect, useState } from 'react';
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

export default function UpdateCollection() {
  const [installments, setInstallments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    method: 'Cash',
    remarks: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPendingInstallments();
  }, []);

  const fetchPendingInstallments = async () => {
    try {
      const response = await api.get('/installments/due');
      setInstallments(response.data);
    } catch (error) {
      console.error('Error fetching installments:', error);
    }
  };

  const handleUpdatePayment = (installment) => {
    setSelectedInstallment(installment);
    setPaymentData({
      amount: installment.amount,
      method: 'Cash',
      remarks: ''
    });
    setShowForm(true);
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.post('/payments', {
        installment_id: selectedInstallment.installment_id,
        amount: parseFloat(paymentData.amount),
        payment_method: paymentData.method,
        payment_date: new Date().toISOString().split('T')[0],
        remarks: paymentData.remarks
      });
      
      alert('Payment updated successfully!');
      setShowForm(false);
      setSelectedInstallment(null);
      setPaymentData({ amount: '', method: 'Cash', remarks: '' });
      fetchPendingInstallments();
    } catch (error) {
      console.error('Error updating payment:', error);
      alert('Error updating payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const markAsBounce = async (installment) => {
    const reason = prompt('Enter bounce reason:');
    if (!reason) return;

    try {
      await api.put(`/installments/${installment.installment_id}`, {
        status: 'Bounced',
        bounce_date: new Date().toISOString().split('T')[0],
        bounce_reason: reason,
        remarks: 'Marked as bounce from update collection'
      });
      
      alert('Installment marked as bounced!');
      fetchPendingInstallments();
    } catch (error) {
      console.error('Error marking bounce:', error);
      alert('Error marking bounce. Please try again.');
    }
  };

  const filteredInstallments = installments.filter(installment =>
    installment.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    installment.loan_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div>
      <div className="page-header">
        <h2>Update Collection</h2>
        <button onClick={fetchPendingInstallments} className="btn btn-primary">
          Refresh
        </button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by customer name or loan ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-control"
        />
      </div>

      {showForm && selectedInstallment && (
        <div className="card form-card">
          <h3>Update Payment - {selectedInstallment.loan_id}</h3>
          <form onSubmit={submitPayment} className="loan-form">
            <div className="form-row">
              <div className="form-group">
                <label>Customer Name</label>
                <input
                  type="text"
                  value={selectedInstallment.customer_name}
                  className="form-control"
                  disabled
                />
              </div>
              <div className="form-group">
                <label>Due Amount</label>
                <input
                  type="text"
                  value={formatCurrency(selectedInstallment.amount)}
                  className="form-control"
                  disabled
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Payment Amount</label>
                <input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                  className="form-control"
                  required
                />
              </div>
              <div className="form-group">
                <label>Payment Method</label>
                <select
                  value={paymentData.method}
                  onChange={(e) => setPaymentData({...paymentData, method: e.target.value})}
                  className="form-control"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Remarks</label>
                <textarea
                  value={paymentData.remarks}
                  onChange={(e) => setPaymentData({...paymentData, remarks: e.target.value})}
                  className="form-control"
                  rows="3"
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" disabled={loading} className="btn btn-success">
                {loading ? 'Updating...' : 'Update Payment'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3>Pending Installments ({filteredInstallments.length})</h3>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Loan ID</th>
              <th>Customer</th>
              <th>Installment</th>
              <th>Due Date</th>
              <th>Amount</th>
              <th>Days Overdue</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInstallments.map((installment, index) => (
              <tr key={index}>
                <td>{installment.loan_id}</td>
                <td>{installment.customer_name}</td>
                <td>{installment.installment_number}</td>
                <td>{installment.due_date}</td>
                <td>{formatCurrency(installment.amount)}</td>
                <td>{installment.days_overdue || 0}</td>
                <td>
                  <span className={`status-badge ${installment.days_overdue > 0 ? 'status-overdue' : 'status-pending'}`}>
                    {installment.days_overdue > 0 ? 'Overdue' : 'Pending'}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => handleUpdatePayment(installment)}
                    className="btn btn-sm btn-primary"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => markAsBounce(installment)}
                    className="btn btn-sm btn-warning"
                    style={{ marginLeft: '5px' }}
                  >
                    Bounce
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}