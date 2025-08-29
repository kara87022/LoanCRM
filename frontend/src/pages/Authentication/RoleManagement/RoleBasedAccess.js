import React, { useState } from 'react';

export default function RoleBasedAccess() {
  const [accessMatrix, setAccessMatrix] = useState([
    { module: 'Loans', admin: true, manager: true, employee: true },
    { module: 'Collections', admin: true, manager: true, employee: false },
    { module: 'Reports', admin: true, manager: true, employee: false },
    { module: 'User Management', admin: true, manager: false, employee: false },
    { module: 'Settings', admin: true, manager: false, employee: false }
  ]);

  return (
    <div>
      <div className="page-header">
        <h2>Role Based Access Control</h2>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr><th>Module</th><th>Admin</th><th>Manager</th><th>Employee</th></tr>
          </thead>
          <tbody>
            {accessMatrix.map((item, index) => (
              <tr key={index}>
                <td>{item.module}</td>
                <td>{item.admin ? '✅' : '❌'}</td>
                <td>{item.manager ? '✅' : '❌'}</td>
                <td>{item.employee ? '✅' : '❌'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}