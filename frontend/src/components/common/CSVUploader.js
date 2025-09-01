import React, { useState } from 'react';
import axios from 'axios';
import './CSVUploader.css';

const CSVUploader = ({ endpoint, onSuccess, onError, buttonText = 'Upload CSV', acceptedFileTypes = '.csv' }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError('');
      } else {
        setFile(null);
        setError('Please select a CSV file');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      setSuccess(`File uploaded successfully! ${response.data.count} records processed.`);
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('csv-file-input');
      if (fileInput) fileInput.value = '';
      
      if (onSuccess) onSuccess(response.data);
    } catch (err) {
      console.error('Upload error:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to upload file';
      setError(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="csv-uploader">
      <div className="csv-uploader-container">
        <div className="file-input-container">
          <input
            type="file"
            id="csv-file-input"
            accept={acceptedFileTypes}
            onChange={handleFileChange}
            disabled={loading}
          />
          <label htmlFor="csv-file-input" className="file-input-label">
            {file ? file.name : 'Choose CSV file'}
          </label>
        </div>
        
        <button 
          className="upload-button" 
          onClick={handleUpload} 
          disabled={!file || loading}
        >
          {loading ? 'Uploading...' : buttonText}
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <div className="csv-instructions">
        <h4>CSV Format Requirements:</h4>
        <ul>
          <li>File must be in CSV format</li>
          <li>Required columns: loan_id, installment_number, due_date, amount</li>
          <li>Optional columns: status</li>
          <li>Dates should be in YYYY-MM-DD format</li>
        </ul>
        <a href="/sample-installments.csv" download className="sample-download">
          Download Sample CSV Template
        </a>
      </div>
    </div>
  );
};

export default CSVUploader;