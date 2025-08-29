import React, { useState } from 'react';

export default function AssignPermissions() {
  const [users, setUsers] = useState([
    { id: 1, name: 'John Doe', role: 'employee', permissions: ['loans.view', 'collections.view'] },
    { id: 2, name: 'Jane Smith', role: 'manager', permissions: ['loans.all', 'collections.all', 'reports.view'] }
  ]);

  const permissions = [
    'loans.view', 'loans.create', 'loans.edit', 'loans.delete',
    'collections.view', 'collections.create', 'collections.edit',
    'reports.view', 'reports.create', 'users.manage', 'settings.manage'
  ];

  return (
    <div>
      <div className="page-header">
        <h2>Assign Permissions</h2>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr><th>User</th><th>Role</th><th>Permissions</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.role}</td>
                <td>{user.permissions.join(', ')}</td>
                <td>
                  <button className="btn btn-sm btn-primary">Edit Permissions</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}