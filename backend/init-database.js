require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

console.log('Connecting to database...');

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err.message);
    process.exit(1);
  }
  console.log('Connected to MySQL database.');
  
  // Update loans_master table structure
  const updateLoansMasterTable = `
    ALTER TABLE loans_master 
    ADD COLUMN IF NOT EXISTS processing_fee INT AFTER loan_amount,
    ADD COLUMN IF NOT EXISTS total_installments INT AFTER installment_amount
  `;
  
  db.query(updateLoansMasterTable, (err) => {
    if (err && !err.message.includes('Duplicate column name')) {
      console.error('Error updating loans_master table:', err.message);
    } else {
      console.log('loans_master table structure updated successfully');
    }
    
    // Test query
    db.query('SELECT COUNT(*) as count FROM loans_master', (err, results) => {
      if (err) {
        console.error('Error querying database:', err.message);
      } else {
        console.log(`Database test successful. Found ${results[0].count} loans in database.`);
      }
      
      db.end();
      console.log('Database initialization complete.');
    });
  });
});