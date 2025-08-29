import React, { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:4000/api' });
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function ClientManagement() {
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', address: '', occupation: '', income: ''
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/clients', formData);
      setFormData({ name: '', phone: '', email: '', address: '', occupation: '', income: '' });
      setShowForm(false);
      fetchClients();
      alert('Client added successfully!');
    } catch (error) {
      alert('Error adding client');
    }
  };

  const filteredClients = clients.filter(client => 
    client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.includes(searchTerm)
  );

  return (
    <div>
      <div className="page-header">
        <h2>Client Management</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Cancel' : 'Add Client'}
        </button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search clients by name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-control"
        />
      </div>

      {showForm && (
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" className="form-control" value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input type="tel" className="form-control" value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Email</label>
                <input type="email" className="form-control" value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Occupation</label>
                <input type="text" className="form-control" value={formData.occupation}
                  onChange={(e) => setFormData({...formData, occupation: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label>Address</label>
              <textarea className="form-control" value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Monthly Income</label>
              <input type="number" className="form-control" value={formData.income}
                onChange={(e) => setFormData({...formData, income: e.target.value})} />
            </div>
            <button type="submit" className="btn btn-success">Add Client</button>
          </form>
        </div>
      )}

      <div className="card">
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Phone</th><th>Email</th><th>Occupation</th><th>Income</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filteredClients.map(client => (
              <tr key={client.id}>
                <td>{client.name}</td>
                <td>{client.phone}</td>
                <td>{client.email}</td>
                <td>{client.occupation}</td>
                <td>₹{client.income?.toLocaleString()}</td>
                <td>
                  <button className="btn btn-sm btn-primary">View</button>
                  <button className="btn btn-sm btn-info">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}