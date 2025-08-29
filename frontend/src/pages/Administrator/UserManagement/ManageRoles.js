import React, { useState } from 'react';

export default function ManageRoles() {
  const [roles, setRoles] = useState([
    { id: 1, name: 'Admin', description: 'Full system access', permissions: 15 },
    { id: 2, name: 'Manager', description: 'Department management', permissions: 8 },
    { id: 3, name: 'Employee', description: 'Basic operations', permissions: 4 }
  ]);

  return (
    <div>
      <div className="page-header">
        <h2>Manage Roles</h2>
        <button className="btn btn-primary">Add Role</button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr><th>Role Name</th><th>Description</th><th>Permissions</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {roles.map(role => (
              <tr key={role.id}>
                <td>{role.name}</td>
                <td>{role.description}</td>
                <td>{role.permissions} permissions</td>
                <td>
                  <button className="btn btn-sm btn-primary">Edit</button>
                  <button className="btn btn-sm btn-danger">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}