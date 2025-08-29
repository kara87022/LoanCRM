require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL database.');
  
  // Add missing columns to loans_master table
  const alterQueries = [
    'ALTER TABLE loans_master ADD COLUMN IF NOT EXISTS processing_fee INT AFTER loan_amount',
    'ALTER TABLE loans_master ADD COLUMN IF NOT EXISTS roi FLOAT AFTER interest_earned',
    'ALTER TABLE loans_master ADD COLUMN IF NOT EXISTS tenure_days INT AFTER roi',
    'ALTER TABLE loans_master ADD COLUMN IF NOT EXISTS total_installments INT AFTER installment_amount'
  ];
  
  alterQueries.forEach((query, index) => {
    db.query(query, (err) => {
      if (err) {
        console.error(`Error executing query ${index + 1}:`, err.message);
      } else {
        console.log(`✓ Query ${index + 1} executed successfully`);
      }
      
      if (index === alterQueries.length - 1) {
        // Copy data from disbursed_cases to loans_master
        console.log('Copying data from disbursed_cases to loans_master...');
        
        db.query(`
          INSERT IGNORE INTO loans_master 
          (loan_id, branch, sourced_by, customer_name, loan_amount, processing_fee, pf, gst, net_disbursement, repayment_amount, interest_earned, roi, tenure_days, date_of_disbursement, installment_amount, total_installments, no_of_installment, status, created_at)
          SELECT 
            loan_id, branch, sourced_by, customer_name, loan_amount, pf, pf, gst, net_disbursement, repayment_amount, interest_earned, 
            CASE WHEN loan_amount > 0 THEN ((repayment_amount - loan_amount) / loan_amount * 100) ELSE 20 END as roi,
            100 as tenure_days,
            date_of_disbursement, installment_amount, no_of_installment, no_of_installment, status, created_at
          FROM disbursed_cases
        `, (err, result) => {
          if (err) {
            console.error('Error copying data:', err.message);
          } else {
            console.log(`✓ Copied ${result.affectedRows} records to loans_master`);
          }
          
          db.end();
          console.log('Database update complete.');
        });
      }
    });
  });
});