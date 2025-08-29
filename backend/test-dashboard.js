require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect(() => {
  console.log('Testing dashboard stats...');
  
  const query = `
    SELECT 
      COUNT(*) as totalCases,
      SUM(COALESCE(net_disbursement, 0)) as totalDisbursement,
      SUM(COALESCE(repayment_amount, 0)) as totalRepayment,
      SUM(COALESCE(interest_earned, 0)) as totalInterest,
      SUM(CASE WHEN COALESCE(status, 'Active') = 'Active' THEN 1 ELSE 0 END) as activeLoans
    FROM loans_master
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error:', err.message);
    } else {
      const stats = results[0];
      console.log('Dashboard Stats:');
      console.log('Total Cases:', stats.totalCases);
      console.log('Total Disbursement: ₹', (stats.totalDisbursement || 0).toLocaleString());
      console.log('Total Repayment: ₹', (stats.totalRepayment || 0).toLocaleString());
      console.log('Total Interest: ₹', (stats.totalInterest || 0).toLocaleString());
      console.log('Active Loans:', stats.activeLoans);
    }
    
    // Test installments
    db.query(`
      SELECT 
        COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pendingInstallments,
        COUNT(CASE WHEN status = 'Pending' AND due_date < CURDATE() THEN 1 END) as overdueInstallments
      FROM installments
    `, (err, results) => {
      if (err) {
        console.error('Installment Error:', err.message);
      } else {
        console.log('Pending Installments:', results[0].pendingInstallments);
        console.log('Overdue Installments:', results[0].overdueInstallments);
      }
      db.end();
    });
  });
});