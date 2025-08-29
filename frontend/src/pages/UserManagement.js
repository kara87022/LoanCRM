import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../App.css';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'employee'
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingUser) {
        await axios.put(`http://localhost:4000/api/users/${editingUser.id}`, formData);
        alert('User updated successfully!');
      } else {
        await axios.post('http://localhost:4000/api/users', formData);
        alert('User created successfully!');
      }
      resetForm();
      fetchUsers();
    } catch (error) {
      alert('Error saving user: ' + error.response?.data?.error);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      role: 'employee'
    });
    setShowForm(false);
    setEditingUser(null);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      role: user.role
    });
    setShowForm(true);
  };

  const handleDelete = async (userId, username) => {
    if (username === 'admin') {
      alert('Cannot delete admin user!');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`http://localhost:4000/api/users/${userId}`);
        fetchUsers();
        alert('User deleted successfully!');
      } catch (error) {
        alert('Error deleting user');
      }
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await axios.put(`http://localhost:4000/api/users/${userId}/status`, {
        active: !currentStatus
      });
      fetchUsers();
    } catch (error) {
      alert('Error updating user status');
    }
  };

  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role) => {
    switch(role) {
      case 'admin': return 'background-color: #fee2e2; color: #991b1b;';
      case 'manager': return 'background-color: #dbeafe; color: #1e40af;';
      case 'employee': return 'background-color: #dcfce7; color: #166534;';
      default: return 'background-color: #f3f4f6; color: #374151;';
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>User Management</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
        >
          {showForm ? 'Cancel' : 'Create New User'}
        </button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by username or role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-control"
        />
      </div>

      {showForm && (
        <div className="card form-card">
          <h3>{editingUser ? 'Edit User' : 'Create New User'}</h3>
          <form onSubmit={handleSubmit} className="user-form">
            <div className="form-row">
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="form-control"
                  required
                  disabled={editingUser && editingUser.username === 'admin'}
                />
              </div>
              <div className="form-group">
                <label>Password {editingUser && '(Leave blank to keep current)'}</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="form-control"
                  required={!editingUser}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="form-control"
                  disabled={editingUser && editingUser.username === 'admin'}
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-success"
              >
                {loading ? 'Saving...' : (editingUser ? 'Update User' : 'Create User')}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3>All Users ({filteredUsers.length})</h3>
        </div>
        
        {/* User Statistics */}
        <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#991b1b' }}>
                {users.filter(u => u.role === 'admin').length}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Admins</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e40af' }}>
                {users.filter(u => u.role === 'manager').length}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Managers</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#166534' }}>
                {users.filter(u => u.role === 'employee').length}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Employees</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669' }}>
                {users.length}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total Users</div>
            </div>
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>
                  <div style={{ fontWeight: user.username === 'admin' ? 'bold' : 'normal' }}>
                    {user.username}
                    {user.username === 'admin' && (
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#991b1b' }}>
                        (System Admin)
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <span 
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      ...getRoleColor(user.role)
                    }}
                  >
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </td>
                <td>
                  <span 
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      backgroundColor: '#dcfce7',
                      color: '#166534'
                    }}
                  >
                    Active
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button
                      onClick={() => handleEdit(user)}
                      className="btn btn-sm btn-primary"
                      disabled={user.username === 'admin'}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(user.id, user.username)}
                      className="btn btn-sm"
                      style={{
                        backgroundColor: user.username === 'admin' ? '#d1d5db' : '#ef4444',
                        color: user.username === 'admin' ? '#6b7280' : 'white',
                        cursor: user.username === 'admin' ? 'not-allowed' : 'pointer'
                      }}
                      disabled={user.username === 'admin'}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
