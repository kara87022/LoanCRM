import React, { useState } from 'react';

export default function RiskAssessment() {
  const [assessment, setAssessment] = useState({
    income: '',
    expenses: '',
    existing_loans: '',
    credit_score: '',
    employment_type: 'Salaried'
  });
  const [result, setResult] = useState(null);

  const calculateRisk = () => {
    const score = parseInt(assessment.credit_score) || 0;
    const income = parseInt(assessment.income) || 0;
    const expenses = parseInt(assessment.expenses) || 0;
    const loans = parseInt(assessment.existing_loans) || 0;
    
    let riskScore = 0;
    if (score >= 750) riskScore += 30;
    else if (score >= 650) riskScore += 20;
    else riskScore += 10;
    
    const disposable = income - expenses - loans;
    if (disposable > 50000) riskScore += 25;
    else if (disposable > 25000) riskScore += 15;
    else riskScore += 5;
    
    if (assessment.employment_type === 'Salaried') riskScore += 20;
    else riskScore += 10;
    
    const category = riskScore >= 70 ? 'Low Risk' : riskScore >= 50 ? 'Medium Risk' : 'High Risk';
    const color = riskScore >= 70 ? '#28a745' : riskScore >= 50 ? '#ffc107' : '#dc3545';
    
    setResult({ score: riskScore, category, color });
  };

  return (
    <div>
      <div className="page-header">
        <h2>Risk Assessment</h2>
      </div>
      <div className="card">
        <div className="card-header">
          <h3>Risk Evaluation Form</h3>
        </div>
        <div style={{ padding: '20px' }}>
          <div className="form-row">
            <div className="form-group">
              <label>Monthly Income</label>
              <input
                type="number"
                value={assessment.income}
                onChange={(e) => setAssessment({...assessment, income: e.target.value})}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>Monthly Expenses</label>
              <input
                type="number"
                value={assessment.expenses}
                onChange={(e) => setAssessment({...assessment, expenses: e.target.value})}
                className="form-control"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Existing Loan EMIs</label>
              <input
                type="number"
                value={assessment.existing_loans}
                onChange={(e) => setAssessment({...assessment, existing_loans: e.target.value})}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>Credit Score</label>
              <input
                type="number"
                value={assessment.credit_score}
                onChange={(e) => setAssessment({...assessment, credit_score: e.target.value})}
                className="form-control"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Employment Type</label>
              <select
                value={assessment.employment_type}
                onChange={(e) => setAssessment({...assessment, employment_type: e.target.value})}
                className="form-control"
              >
                <option value="Salaried">Salaried</option>
                <option value="Self-Employed">Self-Employed</option>
                <option value="Business">Business</option>
              </select>
            </div>
            <div className="form-group">
              <button onClick={calculateRisk} className="btn btn-primary">Calculate Risk</button>
            </div>
          </div>
        </div>
      </div>

      {result && (
        <div className="card">
          <div className="card-header">
            <h3>Risk Assessment Result</h3>
          </div>
          <div style={{ padding: '20px' }}>
            <div className="stats-grid">
              <div className="stat-card">
                <h3 style={{ color: result.color }}>{result.score}/100</h3>
                <p>Risk Score</p>
              </div>
              <div className="stat-card">
                <h3 style={{ color: result.color }}>{result.category}</h3>
                <p>Risk Category</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}