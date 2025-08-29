import React, { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:4000/api' });
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function BranchManagement() {
  const [branches, setBranches] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', address: '', manager: '', phone: '' });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const response = await api.get('/branches');
      setBranches(response.data);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/branches', formData);
      setFormData({ name: '', address: '', manager: '', phone: '' });
      setShowForm(false);
      fetchBranches();
      alert('Branch added successfully!');
    } catch (error) {
      alert('Error adding branch');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Branch Management</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Cancel' : 'Add Branch'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Branch Name</label>
                <input type="text" className="form-control" value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Manager</label>
                <input type="text" className="form-control" value={formData.manager}
                  onChange={(e) => setFormData({...formData, manager: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label>Address</label>
              <textarea className="form-control" value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input type="tel" className="form-control" value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})} />
            </div>
            <button type="submit" className="btn btn-success">Add Branch</button>
          </form>
        </div>
      )}

      <div className="card">
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Manager</th><th>Address</th><th>Phone</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {branches.map(branch => (
              <tr key={branch.id}>
                <td>{branch.name}</td>
                <td>{branch.manager}</td>
                <td>{branch.address}</td>
                <td>{branch.phone}</td>
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