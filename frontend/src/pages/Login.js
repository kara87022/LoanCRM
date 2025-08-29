import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:4000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
        navigate('/');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Connection error. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Login</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{width: '100%'}}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div style={{marginTop: '1rem', fontSize: '0.875rem', color: '#666'}}>
          <strong>Test Credentials:</strong><br/>
          Username: admin<br/>
          Password: admin123
        </div>
      </div>
    </div>
  );
};

export default Login;
