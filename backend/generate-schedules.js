require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect(() => {
  console.log('Generating installment schedules for all loans...');
  
  db.query(`
    SELECT l.loan_id, l.loan_amount, l.repayment_amount, l.date_of_disbursement, l.installment_amount
    FROM loans_master l
    LEFT JOIN installments i ON l.loan_id = i.loan_id
    WHERE i.loan_id IS NULL AND l.date_of_disbursement IS NOT NULL
  `, (err, loans) => {
    if (err) {
      console.error('Error:', err.message);
      return;
    }
    
    console.log(`Found ${loans.length} loans without installment schedules`);
    
    if (loans.length === 0) {
      console.log('No loans to process');
      db.end();
      return;
    }

    const allInstallments = [];
    loans.forEach(loan => {
      const installment_amount = loan.installment_amount || Math.round(loan.repayment_amount / 14);
      
      for (let i = 1; i <= 14; i++) {
        const due_date = new Date(loan.date_of_disbursement);
        due_date.setDate(due_date.getDate() + (i * 7));
        
        allInstallments.push([loan.loan_id, i, due_date.toISOString().split('T')[0], installment_amount, 'Pending']);
      }
    });

    const query = 'INSERT IGNORE INTO installments (loan_id, installment_number, due_date, amount, status) VALUES ?';
    db.query(query, [allInstallments], (err, result) => {
      if (err) {
        console.error('Error inserting installments:', err.message);
      } else {
        console.log(`✓ Generated ${result.affectedRows} installments for ${loans.length} loans`);
        console.log('Installment schedule generation completed!');
      }
      db.end();
    });
  });
});