import React, { useState } from 'react';

export default function KycDocuments() {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = (e, docType) => {
    const file = e.target.files[0];
    if (file) {
      setDocuments(prev => [...prev, { type: docType, file: file.name, status: 'Uploaded' }]);
    }
  };

  const requiredDocs = [
    'Aadhaar Card',
    'PAN Card',
    'Income Proof',
    'Bank Statement',
    'Address Proof',
    'Photograph'
  ];

  return (
    <div>
      <div className="page-header">
        <h2>KYC & Documents</h2>
      </div>
      <div className="card">
        <div className="card-header">
          <h3>Required Documents</h3>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Document Type</th><th>Status</th><th>Upload</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requiredDocs.map((doc, index) => {
              const uploaded = documents.find(d => d.type === doc);
              return (
                <tr key={index}>
                  <td>{doc}</td>
                  <td>
                    <span className={`status-badge ${uploaded ? 'status-uploaded' : 'status-pending'}`}>
                      {uploaded ? 'Uploaded' : 'Pending'}
                    </span>
                  </td>
                  <td>
                    <input
                      type="file"
                      onChange={(e) => handleFileUpload(e, doc)}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="form-control"
                    />
                  </td>
                  <td>
                    {uploaded && (
                      <>
                        <button className="btn btn-sm btn-primary">View</button>
                        <button className="btn btn-sm btn-success">Verify</button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}