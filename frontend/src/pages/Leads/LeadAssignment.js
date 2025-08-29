import React, { useState } from 'react';

export default function LeadAssignment() {
  const [leads] = useState([
    { id: 1, name: 'John Smith', phone: '9876543210', loanType: 'Personal', amount: 100000, status: 'Unassigned' },
    { id: 2, name: 'Jane Doe', phone: '9876543211', loanType: 'Business', amount: 500000, status: 'Assigned' }
  ]);

  const [employees] = useState([
    { id: 1, name: 'Employee 1', workload: 5 },
    { id: 2, name: 'Employee 2', workload: 8 },
    { id: 3, name: 'Employee 3', workload: 3 }
  ]);

  return (
    <div>
      <div className="page-header">
        <h2>Lead Assignment</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
        <div className="card">
          <h3>Unassigned Leads</h3>
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Phone</th><th>Loan Type</th><th>Amount</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {leads.filter(lead => lead.status === 'Unassigned').map(lead => (
                <tr key={lead.id}>
                  <td>{lead.name}</td>
                  <td>{lead.phone}</td>
                  <td>{lead.loanType}</td>
                  <td>₹{lead.amount.toLocaleString()}</td>
                  <td>
                    <select className="form-control">
                      <option>Select Employee</option>
                      {employees.map(emp => (
                        <option key={emp.id}>{emp.name} ({emp.workload} leads)</option>
                      ))}
                    </select>
                    <button className="btn btn-sm btn-success">Assign</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3>Employee Workload</h3>
          {employees.map(emp => (
            <div key={emp.id} style={{marginBottom: '1rem'}}>
              <p>{emp.name}: {emp.workload} leads</p>
              <div className="progress">
                <div className="progress-bar" style={{width: `${(emp.workload/10)*100}%`}}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}