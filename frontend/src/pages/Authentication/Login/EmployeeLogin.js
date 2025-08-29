import React, { useState } from 'react';

export default function EmployeeLogin() {
  const [formData, setFormData] = useState({ employeeId: '', password: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Employee login functionality coming soon');
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Employee Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Employee ID</label>
            <input type="text" className="form-control" value={formData.employeeId}
              onChange={(e) => setFormData({...formData, employeeId: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" className="form-control" value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{width: '100%'}}>
            Login
          </button>
        </form>
      </div>
    </div>
  );
}