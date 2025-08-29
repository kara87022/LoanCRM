import React, { useState } from 'react';

export default function EmailTemplates() {
  const [templates, setTemplates] = useState([
    { id: 1, name: 'Loan Approval', subject: 'Loan Approved - Congratulations!', content: 'Dear {customerName}, Your loan application has been approved...' },
    { id: 2, name: 'Loan Rejection', subject: 'Loan Application Update', content: 'Dear {customerName}, We regret to inform you...' },
    { id: 3, name: 'Payment Reminder', subject: 'Payment Due Reminder', content: 'Dear {customerName}, This is a reminder that your payment of ₹{amount} is due on {dueDate}...' }
  ]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div className="page-header">
        <h2>Email Templates</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Cancel' : 'Add Template'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <form>
            <div className="form-group">
              <label>Template Name</label>
              <input type="text" className="form-control" placeholder="Enter template name" />
            </div>
            <div className="form-group">
              <label>Subject</label>
              <input type="text" className="form-control" placeholder="Email subject" />
            </div>
            <div className="form-group">
              <label>Content</label>
              <textarea className="form-control" rows="6" placeholder="Email content with variables like {customerName}, {amount}, {dueDate}"></textarea>
            </div>
            <button type="submit" className="btn btn-success">Save Template</button>
          </form>
        </div>
      )}

      <div className="card">
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Subject</th><th>Variables</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {templates.map(template => (
              <tr key={template.id}>
                <td>{template.name}</td>
                <td>{template.subject}</td>
                <td>{template.content.match(/{[^}]+}/g)?.join(', ') || 'None'}</td>
                <td>
                  <button className="btn btn-sm btn-primary">Edit</button>
                  <button className="btn btn-sm btn-info">Preview</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}