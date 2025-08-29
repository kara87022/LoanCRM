import React, { useState } from 'react';

export default function KycDocumentTypes() {
  const [documents, setDocuments] = useState([
    { id: 1, name: 'Aadhaar Card', required: true, category: 'Identity' },
    { id: 2, name: 'PAN Card', required: true, category: 'Identity' },
    { id: 3, name: 'Salary Slip', required: false, category: 'Income' },
    { id: 4, name: 'Bank Statement', required: true, category: 'Financial' }
  ]);

  return (
    <div>
      <div className="page-header">
        <h2>KYC Document Types</h2>
        <button className="btn btn-primary">Add Document Type</button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr><th>Document Name</th><th>Category</th><th>Required</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {documents.map(doc => (
              <tr key={doc.id}>
                <td>{doc.name}</td>
                <td>{doc.category}</td>
                <td>{doc.required ? 'Yes' : 'No'}</td>
                <td>
                  <button className="btn btn-sm btn-primary">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}