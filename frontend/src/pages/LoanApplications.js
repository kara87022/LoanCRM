import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../App.css';

const LoanApplications = () => {
  const [loanDetails, setLoanDetails] = useState({
    loan_id: '',
    customer_name: '',
    loan_amount: '',
    date_of_disbursement: '',
    loan_type: '',
    status: ''
  });
  const [dropdownOptions, setDropdownOptions] = useState({ loanTypes: [], statuses: [] });

  useEffect(() => {
    axios.get('http://localhost:4000/dropdowns/loanTypes').then((res) => {
      setDropdownOptions((prev) => ({ ...prev, loanTypes: res.data }));
    });
    axios.get('http://localhost:4000/dropdowns/statuses').then((res) => {
      setDropdownOptions((prev) => ({ ...prev, statuses: res.data }));
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoanDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Create loan
      await axios.post('http://localhost:4000/loans', loanDetails);

      // Generate installment schedule
      await axios.post('http://localhost:4000/installments/generate', {
        loan_id: loanDetails.loan_id,
        loan_amount: loanDetails.loan_amount,
        date_of_disbursement: loanDetails.date_of_disbursement
      });

      alert('Loan and installment schedule created successfully!');
    } catch (error) {
      console.error('Error creating loan or installment schedule:', error);
      alert('Failed to create loan or installment schedule.');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>Create Loan Application</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="loan_id">Loan ID:</label>
          <input
            type="text"
            id="loan_id"
            name="loan_id"
            value={loanDetails.loan_id}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="customer_name">Customer Name:</label>
          <input
            type="text"
            id="customer_name"
            name="customer_name"
            value={loanDetails.customer_name}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="loan_amount">Loan Amount:</label>
          <input
            type="number"
            id="loan_amount"
            name="loan_amount"
            value={loanDetails.loan_amount}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="date_of_disbursement">Date of Disbursement:</label>
          <input
            type="date"
            id="date_of_disbursement"
            name="date_of_disbursement"
            value={loanDetails.date_of_disbursement}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="loan_type">Loan Type:</label>
          <select
            id="loan_type"
            name="loan_type"
            value={loanDetails.loan_type}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          >
            <option value="">Select Loan Type</option>
            {dropdownOptions.loanTypes.map((option) => (
              <option key={option.id} value={option.value}>
                {option.value}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="status">Status:</label>
          <select
            id="status"
            name="status"
            value={loanDetails.status}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          >
            <option value="">Select Status</option>
            {dropdownOptions.statuses.map((option) => (
              <option key={option.id} value={option.value}>
                {option.value}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#004ba0', color: '#fff', border: 'none', borderRadius: '5px' }}>
          Submit
        </button>
      </form>
    </div>
  );
};

export default LoanApplications;
