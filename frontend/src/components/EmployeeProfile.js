import React from 'react';

export default function EmployeeProfile({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5>Employee Profile</h5>
            <button onClick={onClose} className="btn-close">×</button>
          </div>
          <div className="modal-body">
            <div className="profile-info">
              <p><strong>Name:</strong> John Doe</p>
              <p><strong>Employee ID:</strong> EMP001</p>
              <p><strong>Role:</strong> Loan Officer</p>
              <p><strong>Branch:</strong> Main Branch</p>
              <p><strong>Email:</strong> john.doe@company.com</p>
            </div>
          </div>
          <div className="modal-footer">
            <button onClick={onClose} className="btn btn-secondary">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}