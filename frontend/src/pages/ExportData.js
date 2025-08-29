import React from 'react';
import '../App.css';
import { saveAs } from 'file-saver';

export default function ExportData() {
  const handleExport = () => {
    fetch('http://localhost:4000/export-data')
      .then((response) => response.blob())
      .then((blob) => {
        saveAs(blob, 'loan_data.xlsx');
      })
      .catch((error) => console.error('Error exporting data:', error));
  };

  return (
    <div className="main-content">
      <h2 style={{ color: '#1a237e', marginBottom: 24 }}>Export Data</h2>
      <button className="btn" onClick={handleExport}>
        Export to Excel
      </button>
    </div>
  );
}
