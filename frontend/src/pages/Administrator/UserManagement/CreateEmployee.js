import React, { useState } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:4000/api' });
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function CreateEmployee() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'employee',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    branch: '',
    department: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    try {
      await api.post('/users', formData);
      alert('Employee created successfully!');
      setFormData({
        username: '', password: '', confirmPassword: '', role: 'employee',
        firstName: '', lastName: '', email: '', phone: '', branch: '', department: ''
      });
    } catch (error) {
      alert('Error creating employee: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Create Employee</h2>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input type="text" className="form-control" value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input type="text" className="form-control" value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Username</label>
              <input type="text" className="form-control" value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" className="form-control" value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Password</label>
              <input type="password" className="form-control" value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input type="password" className="form-control" value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Role</label>
              <select className="form-control" value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}>
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input type="tel" className="form-control" value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Branch</label>
              <select className="form-control" value={formData.branch}
                onChange={(e) => setFormData({...formData, branch: e.target.value})}>
                <option value="">Select Branch</option>
                <option value="main">Main Branch</option>
                <option value="north">North Branch</option>
                <option value="south">South Branch</option>
              </select>
            </div>
            <div className="form-group">
              <label>Department</label>
              <select className="form-control" value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}>
                <option value="">Select Department</option>
                <option value="loans">Loans</option>
                <option value="collections">Collections</option>
                <option value="operations">Operations</option>
                <option value="customer-service">Customer Service</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-success">Create Employee</button>
        </form>
      </div>
    </div>
  );
}