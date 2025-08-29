import React, { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:4000/api' });
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function BusinessLoan() {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Business Loan',
    minAmount: '',
    maxAmount: '',
    interestRate: '',
    tenure: '',
    processingFee: '',
    eligibility: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products?type=business');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/products', { ...formData, type: 'business' });
      setFormData({ name: 'Business Loan', minAmount: '', maxAmount: '', interestRate: '', tenure: '', processingFee: '', eligibility: '' });
      setShowForm(false);
      fetchProducts();
      alert('Product added successfully!');
    } catch (error) {
      alert('Error adding product');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Business Loan Products</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Cancel' : 'Add Product'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Product Name</label>
                <input type="text" className="form-control" value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Interest Rate (%)</label>
                <input type="number" step="0.01" className="form-control" value={formData.interestRate}
                  onChange={(e) => setFormData({...formData, interestRate: e.target.value})} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Min Amount</label>
                <input type="number" className="form-control" value={formData.minAmount}
                  onChange={(e) => setFormData({...formData, minAmount: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Max Amount</label>
                <input type="number" className="form-control" value={formData.maxAmount}
                  onChange={(e) => setFormData({...formData, maxAmount: e.target.value})} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Tenure (months)</label>
                <input type="number" className="form-control" value={formData.tenure}
                  onChange={(e) => setFormData({...formData, tenure: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Processing Fee (%)</label>
                <input type="number" step="0.01" className="form-control" value={formData.processingFee}
                  onChange={(e) => setFormData({...formData, processingFee: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label>Eligibility Criteria</label>
              <textarea className="form-control" value={formData.eligibility}
                onChange={(e) => setFormData({...formData, eligibility: e.target.value})} />
            </div>
            <button type="submit" className="btn btn-success">Add Product</button>
          </form>
        </div>
      )}

      <div className="card">
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Amount Range</th><th>Interest Rate</th><th>Tenure</th><th>Processing Fee</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>₹{product.minAmount} - ₹{product.maxAmount}</td>
                <td>{product.interestRate}%</td>
                <td>{product.tenure} months</td>
                <td>{product.processingFee}%</td>
                <td>
                  <button className="btn btn-sm btn-primary">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}