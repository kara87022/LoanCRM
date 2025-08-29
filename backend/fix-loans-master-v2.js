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
  
  // Check current structure
  db.query('DESCRIBE loans_master', (err, columns) => {
    if (err) {
      console.error('Error describing table:', err);
      return;
    }
    
    const existingColumns = columns.map(col => col.Field);
    console.log('Existing columns:', existingColumns);
    
    const requiredColumns = [
      { name: 'processing_fee', type: 'INT', after: 'loan_amount' },
      { name: 'roi', type: 'FLOAT', after: 'interest_earned' },
      { name: 'tenure_days', type: 'INT', after: 'roi' },
      { name: 'total_installments', type: 'INT', after: 'installment_amount' }
    ];
    
    let alterQueries = [];
    
    requiredColumns.forEach(col => {
      if (!existingColumns.includes(col.name)) {
        alterQueries.push(`ALTER TABLE loans_master ADD COLUMN ${col.name} ${col.type} AFTER ${col.after}`);
      }
    });
    
    if (alterQueries.length === 0) {
      console.log('All columns already exist. Copying data...');
      copyData();
      return;
    }
    
    console.log(`Adding ${alterQueries.length} missing columns...`);
    
    let completed = 0;
    alterQueries.forEach((query, index) => {
      db.query(query, (err) => {
        if (err) {
          console.error(`Error executing query ${index + 1}:`, err.message);
        } else {
          console.log(`✓ Added column: ${requiredColumns[index].name}`);
        }
        
        completed++;
        if (completed === alterQueries.length) {
          copyData();
        }
      });
    });
  });
  
  function copyData() {
    console.log('Copying data from disbursed_cases to loans_master...');
    
    db.query(`
      INSERT IGNORE INTO loans_master 
      (loan_id, branch, sourced_by, customer_name, loan_amount, processing_fee, pf, gst, net_disbursement, repayment_amount, interest_earned, roi, tenure_days, date_of_disbursement, installment_amount, total_installments, no_of_installment, status, created_at)
      SELECT 
        loan_id, branch, sourced_by, customer_name, loan_amount, 
        pf as processing_fee, pf, gst, net_disbursement, repayment_amount, interest_earned, 
        CASE WHEN loan_amount > 0 THEN ROUND(((repayment_amount - loan_amount) / loan_amount * 100), 2) ELSE 20 END as roi,
        100 as tenure_days,
        date_of_disbursement, installment_amount, 
        no_of_installment as total_installments, no_of_installment, 
        COALESCE(status, 'Active') as status, 
        COALESCE(created_at, NOW()) as created_at
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