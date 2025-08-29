import React, { useState } from 'react';

export default function VerificationChecklist() {
  const [checklist, setChecklist] = useState([
    { id: 1, item: 'Identity Verification', completed: true },
    { id: 2, item: 'Income Verification', completed: true },
    { id: 3, item: 'Address Verification', completed: false },
    { id: 4, item: 'Bank Statement Verification', completed: false },
    { id: 5, item: 'Credit Score Check', completed: true },
    { id: 6, item: 'Employment Verification', completed: false }
  ]);

  const toggleItem = (id) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  return (
    <div>
      <div className="page-header">
        <h2>Verification Checklist</h2>
      </div>
      <div className="card">
        <div className="card-header">
          <h3>Application Verification Items</h3>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Verification Item</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {checklist.map(item => (
              <tr key={item.id}>
                <td>{item.item}</td>
                <td>
                  <span className={`status-badge ${item.completed ? 'status-completed' : 'status-pending'}`}>
                    {item.completed ? 'Completed' : 'Pending'}
                  </span>
                </td>
                <td>
                  <button 
                    onClick={() => toggleItem(item.id)} 
                    className={`btn btn-sm ${item.completed ? 'btn-warning' : 'btn-success'}`}
                  >
                    {item.completed ? 'Mark Pending' : 'Mark Complete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}