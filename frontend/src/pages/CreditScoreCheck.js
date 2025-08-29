import React, { useState } from 'react';

export default function CreditScoreCheck() {
  const [searchTerm, setSearchTerm] = useState('');
  const [creditData, setCreditData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setTimeout(() => {
      setCreditData({
        name: 'John Doe',
        pan: 'ABCDE1234F',
        score: 750,
        grade: 'Good',
        history: [
          { date: '2024-01', score: 720 },
          { date: '2024-02', score: 735 },
          { date: '2024-03', score: 750 }
        ]
      });
      setLoading(false);
    }, 1000);
  };

  return (
    <div>
      <div className="page-header">
        <h2>Credit Score Check</h2>
      </div>
      <div className="card">
        <div className="card-header">
          <h3>Search Credit Score</h3>
        </div>
        <div style={{ padding: '20px' }}>
          <div className="form-row">
            <div className="form-group">
              <label>PAN Number</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter PAN number"
                className="form-control"
              />
            </div>
            <div className="form-group">
              <button onClick={handleSearch} disabled={loading} className="btn btn-primary">
                {loading ? 'Checking...' : 'Check Score'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {creditData && (
        <div className="card">
          <div className="card-header">
            <h3>Credit Report</h3>
          </div>
          <div style={{ padding: '20px' }}>
            <div className="stats-grid">
              <div className="stat-card">
                <h3 style={{ color: creditData.score >= 750 ? '#28a745' : creditData.score >= 650 ? '#ffc107' : '#dc3545' }}>
                  {creditData.score}
                </h3>
                <p>Credit Score</p>
              </div>
              <div className="stat-card">
                <h3>{creditData.grade}</h3>
                <p>Credit Grade</p>
              </div>
              <div className="stat-card">
                <h3>{creditData.name}</h3>
                <p>Applicant Name</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}