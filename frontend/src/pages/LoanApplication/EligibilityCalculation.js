import React, { useState } from 'react';

export default function EligibilityCalculation() {
  const [formData, setFormData] = useState({
    income: '',
    expenses: '',
    age: '',
    employment_type: 'Salaried',
    credit_score: '',
    existing_emis: ''
  });
  const [eligibility, setEligibility] = useState(null);

  const calculateEligibility = () => {
    const income = parseInt(formData.income) || 0;
    const expenses = parseInt(formData.expenses) || 0;
    const age = parseInt(formData.age) || 0;
    const creditScore = parseInt(formData.credit_score) || 0;
    const existingEmis = parseInt(formData.existing_emis) || 0;

    const disposableIncome = income - expenses - existingEmis;
    const maxEmi = disposableIncome * 0.5; // 50% of disposable income
    const maxLoanAmount = maxEmi * 12 * 7; // Assuming 7 years tenure

    let eligibilityScore = 0;
    if (creditScore >= 750) eligibilityScore += 40;
    else if (creditScore >= 650) eligibilityScore += 25;
    else eligibilityScore += 10;

    if (age >= 25 && age <= 55) eligibilityScore += 30;
    else eligibilityScore += 15;

    if (formData.employment_type === 'Salaried') eligibilityScore += 30;
    else eligibilityScore += 20;

    const isEligible = eligibilityScore >= 70 && maxLoanAmount > 100000;

    setEligibility({
      eligible: isEligible,
      maxAmount: Math.round(maxLoanAmount),
      maxEmi: Math.round(maxEmi),
      score: eligibilityScore
    });
  };

  return (
    <div>
      <div className="page-header">
        <h2>Eligibility Calculation</h2>
      </div>
      <div className="card">
        <div className="card-header">
          <h3>Loan Eligibility Calculator</h3>
        </div>
        <div style={{ padding: '20px' }}>
          <div className="form-row">
            <div className="form-group">
              <label>Monthly Income</label>
              <input
                type="number"
                value={formData.income}
                onChange={(e) => setFormData({...formData, income: e.target.value})}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>Monthly Expenses</label>
              <input
                type="number"
                value={formData.expenses}
                onChange={(e) => setFormData({...formData, expenses: e.target.value})}
                className="form-control"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Age</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({...formData, age: e.target.value})}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>Credit Score</label>
              <input
                type="number"
                value={formData.credit_score}
                onChange={(e) => setFormData({...formData, credit_score: e.target.value})}
                className="form-control"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Employment Type</label>
              <select
                value={formData.employment_type}
                onChange={(e) => setFormData({...formData, employment_type: e.target.value})}
                className="form-control"
              >
                <option value="Salaried">Salaried</option>
                <option value="Self-Employed">Self-Employed</option>
                <option value="Business">Business</option>
              </select>
            </div>
            <div className="form-group">
              <label>Existing EMIs</label>
              <input
                type="number"
                value={formData.existing_emis}
                onChange={(e) => setFormData({...formData, existing_emis: e.target.value})}
                className="form-control"
              />
            </div>
          </div>
          <button onClick={calculateEligibility} className="btn btn-primary">Calculate Eligibility</button>
        </div>
      </div>

      {eligibility && (
        <div className="card">
          <div className="card-header">
            <h3>Eligibility Result</h3>
          </div>
          <div style={{ padding: '20px' }}>
            <div className="stats-grid">
              <div className="stat-card">
                <h3 style={{ color: eligibility.eligible ? '#28a745' : '#dc3545' }}>
                  {eligibility.eligible ? 'Eligible' : 'Not Eligible'}
                </h3>
                <p>Loan Status</p>
              </div>
              <div className="stat-card">
                <h3>₹{eligibility.maxAmount.toLocaleString()}</h3>
                <p>Max Loan Amount</p>
              </div>
              <div className="stat-card">
                <h3>₹{eligibility.maxEmi.toLocaleString()}</h3>
                <p>Max EMI</p>
              </div>
              <div className="stat-card">
                <h3>{eligibility.score}/100</h3>
                <p>Eligibility Score</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}