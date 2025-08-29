import React, { useState } from 'react';

export default function SmsTemplates() {
  const [templates, setTemplates] = useState([
    { id: 1, name: 'Loan Approved', content: 'Dear {name}, your loan of Rs.{amount} has been approved. Ref: {loanId}' },
    { id: 2, name: 'Payment Due', content: 'Payment of Rs.{amount} is due on {date}. Pay now to avoid charges.' },
    { id: 3, name: 'Payment Received', content: 'Payment of Rs.{amount} received. Thank you! Balance: Rs.{balance}' }
  ]);

  return (
    <div>
      <div className="page-header">
        <h2>SMS Templates</h2>
        <button className="btn btn-primary">Add Template</button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr><th>Template Name</th><th>Content</th><th>Length</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {templates.map(template => (
              <tr key={template.id}>
                <td>{template.name}</td>
                <td>{template.content.substring(0, 50)}...</td>
                <td>{template.content.length} chars</td>
                <td>
                  <button className="btn btn-sm btn-primary">Edit</button>
                  <button className="btn btn-sm btn-info">Test</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}