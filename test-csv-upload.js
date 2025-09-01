// Test script for CSV upload functionality
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

// Configuration
const API_URL = 'http://localhost:4000/api';
const TEST_CSV_PATH = './test-installments.csv';
const LOGIN_CREDENTIALS = {
  email: 'admin@loancrm.com',
  password: 'admin123'
};

// Create test CSV file
const createTestCSV = () => {
  const csvContent = `loan_id,installment_number,due_date,amount,status
TEST001,1,${new Date().toISOString().split('T')[0]},5000,Pending
TEST001,2,${new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]},5000,Pending`;
  fs.writeFileSync(TEST_CSV_PATH, csvContent);
  console.log('Test CSV file created');
};

// Login and get token
const login = async () => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, LOGIN_CREDENTIALS);
    return response.data.token;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw new Error('Authentication failed');
  }
};

// Upload CSV file
const uploadCSV = async (token) => {
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(TEST_CSV_PATH));
    
    const response = await axios.post(
      `${API_URL}/installments/upload-csv`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('CSV upload failed:', error.response?.data || error.message);
    throw new Error('CSV upload failed');
  }
};

// Verify uploaded installments
const verifyInstallments = async (token) => {
  try {
    const response = await axios.get(
      `${API_URL}/installments/due`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    // Check if our test installments are in the response
    const testInstallments = response.data.filter(inst => inst.loan_id === 'TEST001');
    console.log(`Found ${testInstallments.length} test installments`);
    return testInstallments.length === 2;
  } catch (error) {
    console.error('Verification failed:', error.response?.data || error.message);
    return false;
  }
};

// Run the test
const runTest = async () => {
  try {
    console.log('Starting CSV upload test...');
    
    // Create test CSV file
    createTestCSV();
    
    // Login
    console.log('Logging in...');
    const token = await login();
    console.log('Login successful');
    
    // Upload CSV
    console.log('Uploading CSV...');
    const uploadResult = await uploadCSV(token);
    console.log('Upload result:', uploadResult);
    
    // Verify installments
    console.log('Verifying uploaded installments...');
    const verified = await verifyInstallments(token);
    
    if (verified) {
      console.log('✅ TEST PASSED: CSV upload functionality works correctly');
    } else {
      console.log('❌ TEST FAILED: Could not verify uploaded installments');
    }
    
    // Clean up
    fs.unlinkSync(TEST_CSV_PATH);
    console.log('Test cleanup complete');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
};

// Run the test
runTest();