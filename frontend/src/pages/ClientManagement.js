import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../App.css';

// Configure axios with auth headers
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

export default function ClientManagement() {
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    loan_id: '',
    branch: '',
    sourced_by: '',
    customer_name: '',
    loan_amount: '',
    processing_fee: '',
    gst: '',
    net_disbursement: '',
    repayment_amount: '',
    interest_earned: '',
    date_of_disbursement: '',
    no_of_installments: '',
    installment_amount: ''
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [stats, setStats] = useState({
    totalClients: 0,
    totalDisbursed: 0,
    totalRepayment: 0,
    totalInterest: 0
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      console.log('Fetching clients data...');
      const response = await api.get('/loans');
      console.log('Clients data received:', response.data.length, 'records');
      setClients(response.data);
      calculateStats(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
      alert('Error loading client data. Please check console for details.');
    }
  };

  const calculateStats = (clientData) => {
    const stats = {
      totalClients: clientData.length,
      totalDisbursed: clientData.reduce((sum, client) => sum + (client.net_disbursement || 0), 0),
      totalRepayment: clientData.reduce((sum, client) => sum + (client.repayment_amount || 0), 0),
      totalInterest: clientData.reduce((sum, client) => sum + (client.interest_earned || 0), 0)
    };
    setStats(stats);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        loan_id: formData.loan_id,
        customer_name: formData.customer_name,
        loan_amount: parseInt(formData.loan_amount),
        processing_fee: parseInt(formData.processing_fee),
        gst: parseInt(formData.gst),
        net_disbursement: parseInt(formData.net_disbursement),
        roi: 20, // Default ROI
        tenure_days: 100, // Default tenure
        date_of_disbursement: formData.date_of_disbursement,
        installment_amount: parseInt(formData.installment_amount),
        total_installments: parseInt(formData.no_of_installments)
      };

      if (editingClient) {
        await api.put(`/loans/${editingClient.loan_id}`, payload);
        alert('Client updated successfully!');
      } else {
        await api.post('/loans', payload);
        alert('Client added successfully!');
      }
      resetForm();
      fetchClients();
    } catch (error) {
      alert('Error saving client: ' + error.response?.data?.error);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      loan_id: '',
      branch: '',
      sourced_by: '',
      customer_name: '',
      loan_amount: '',
      processing_fee: '',
      gst: '',
      net_disbursement: '',
      repayment_amount: '',
      interest_earned: '',
      date_of_disbursement: '',
      no_of_installments: '',
      installment_amount: ''
    });
    setShowForm(false);
    setEditingClient(null);
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setFormData({
      loan_id: client.loan_id,
      branch: client.branch || '',
      sourced_by: client.sourced_by || '',
      customer_name: client.customer_name,
      loan_amount: client.loan_amount,
      processing_fee: client.processing_fee,
      gst: client.gst,
      net_disbursement: client.net_disbursement,
      repayment_amount: client.repayment_amount || '',
      interest_earned: client.interest_earned || '',
      date_of_disbursement: client.date_of_disbursement,
      no_of_installments: client.total_installments,
      installment_amount: client.installment_amount
    });
    setShowForm(true);
  };

  const importCSVData = async () => {
    try {
      const csvPath = 'C:\\Users\\DELL\\OneDrive\\Desktop\\Loan CRM\\DATA\\Disbursement.xlsx.csv';
      await api.post('/loans/import-csv', { filePath: csvPath });
      console.log('CSV import completed successfully');
      alert('CSV data imported successfully!');
      fetchClients();
    } catch (error) {
      console.error('CSV import error:', error);
      alert('Error importing CSV data: ' + (error.response?.data?.error || error.message));
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.loan_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBranch = !filterBranch || client.branch === filterBranch;
    return matchesSearch && matchesBranch;
  });

  const branches = [...new Set(clients.map(client => client.branch).filter(Boolean))];

  return (
    <div>
      <div className="page-header">
        <h2>Client Management</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={importCSVData} className="btn btn-success">
            Import CSV Data
          </button>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
            {showForm ? 'Cancel' : 'Add New Client'}
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#3b82f6' }}>Total Clients</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{stats.totalClients}</p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#10b981' }}>Total Disbursed</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>₹{stats.totalDisbursed.toLocaleString()}</p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#f59e0b' }}>Total Repayment</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>₹{stats.totalRepayment.toLocaleString()}</p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#8b5cf6' }}>Total Interest</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>₹{stats.totalInterest.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
        <div className="form-row">
          <div className="form-group">
            <label>Search Clients</label>
            <input
              type="text"
              placeholder="Search by name or loan ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label>Filter by Branch</label>
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="form-control"
            >
              <option value="">All Branches</option>
              {branches.map(branch => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="card form-card">
          <h3>{editingClient ? 'Edit Client' : 'Add New Client'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Loan ID</label>
                <input
                  type="text"
                  value={formData.loan_id}
                  onChange={(e) => setFormData({...formData, loan_id: e.target.value})}
                  className="form-control"
                  required
                  disabled={editingClient}
                />
              </div>
              <div className="form-group">
                <label>Customer Name</label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                  className="form-control"
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Branch</label>
                <input
                  type="text"
                  value={formData.branch}
                  onChange={(e) => setFormData({...formData, branch: e.target.value})}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Sourced By</label>
                <input
                  type="text"
                  value={formData.sourced_by}
                  onChange={(e) => setFormData({...formData, sourced_by: e.target.value})}
                  className="form-control"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Loan Amount</label>
                <input
                  type="number"
                  value={formData.loan_amount}
                  onChange={(e) => setFormData({...formData, loan_amount: e.target.value})}
                  className="form-control"
                  required
                />
              </div>
              <div className="form-group">
                <label>Processing Fee</label>
                <input
                  type="number"
                  value={formData.processing_fee}
                  onChange={(e) => setFormData({...formData, processing_fee: e.target.value})}
                  className="form-control"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>GST</label>
                <input
                  type="number"
                  value={formData.gst}
                  onChange={(e) => setFormData({...formData, gst: e.target.value})}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Net Disbursement</label>
                <input
                  type="number"
                  value={formData.net_disbursement}
                  onChange={(e) => setFormData({...formData, net_disbursement: e.target.value})}
                  className="form-control"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Date of Disbursement</label>
                <input
                  type="date"
                  value={formData.date_of_disbursement}
                  onChange={(e) => setFormData({...formData, date_of_disbursement: e.target.value})}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>No of Installments</label>
                <input
                  type="number"
                  value={formData.no_of_installments}
                  onChange={(e) => setFormData({...formData, no_of_installments: e.target.value})}
                  className="form-control"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Installment Amount</label>
                <input
                  type="number"
                  value={formData.installment_amount}
                  onChange={(e) => setFormData({...formData, installment_amount: e.target.value})}
                  className="form-control"
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" disabled={loading} className="btn btn-success">
                {loading ? 'Saving...' : (editingClient ? 'Update Client' : 'Add Client')}
              </button>
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3>All Clients ({filteredClients.length})</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Loan ID</th>
                <th>Customer Name</th>
                <th>Branch</th>
                <th>Loan Amount</th>
                <th>Net Disbursement</th>
                <th>Installment Amount</th>
                <th>Date of Disbursement</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr key={client.loan_id}>
                  <td>{client.loan_id}</td>
                  <td>{client.customer_name}</td>
                  <td>{client.branch || 'N/A'}</td>
                  <td>₹{client.loan_amount?.toLocaleString()}</td>
                  <td>₹{client.net_disbursement?.toLocaleString()}</td>
                  <td>₹{client.installment_amount?.toLocaleString()}</td>
                  <td>{client.date_of_disbursement}</td>
                  <td>
                    <button
                      onClick={() => handleEdit(client)}
                      className="btn btn-sm btn-primary"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}